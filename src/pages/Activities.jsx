import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const activities = [
    { name: "Hiking", img: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aGlraW5nfGVufDB8fDB8fHww" },
    { name: "Cycling", img: "https://images.unsplash.com/photo-1534146789009-76ed5060ec70?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y3ljbGluZ3xlbnwwfHwwfHx8MA%3D%3D" },
    { name: "Paragliding", img: "https://images.unsplash.com/photo-1719949122509-74d0a1d08b44?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cGFyYWdsaWRpbmd8ZW58MHx8MHx8fDA%3D" },
    { name: "Parasailing", img: "https://images.unsplash.com/photo-1560419656-c2fe828696af?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cGFyYXNhaWxpbmd8ZW58MHx8MHx8fDA%3D" },
    { name: "Running / Marathon", img: "https://images.unsplash.com/photo-1547483238-f400e65ccd56?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHJ1bm5pbmd8ZW58MHx8MHx8fDA%3D" },
    { name: "Pilgrimage", img: "https://images.unsplash.com/photo-1616244013240-227ec9abfefb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aG9seXxlbnwwfHwwfHx8MA%3D%3D" },
    { name: "Horse Riding", img: "https://images.unsplash.com/photo-1589400867230-3491ceee2934?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGhvcnNlJTIwcmlkaW5nfGVufDB8fDB8fHww" },
    { name: "Fishing", img: "https://images.unsplash.com/photo-1493787039806-2edcbe808750?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGZpc2hpbmd8ZW58MHx8MHx8fDA%3D" },
    { name: "Rafting", img: "https://images.unsplash.com/photo-1642933196504-62107dac9258?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cmFmdGluZ3xlbnwwfHwwfHx8MA%3D%3D" },
    { name: "Quad Riding", img: "https://plus.unsplash.com/premium_photo-1698670081064-4b3103e04ba6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fHF1YWR8ZW58MHx8MHx8fDA%3D" },
    { name: "Skiing & Snowboarding", img: "https://images.unsplash.com/photo-1614358606268-aa86853578b4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHNraWlzJTIwYW5kJTIwc25vd2JvYXJkcyUyMGVxdWlwbW1lbnR8ZW58MHx8MHx8fDA%3D" },
    { name: "Water Skiing", img: "https://images.unsplash.com/photo-1627319706385-dfde6ea09e4e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHdhdGVyJTIwc2tpaW5nfGVufDB8fDB8fHww" },
    { name: "Skydiving", img: "https://images.unsplash.com/photo-1630879937467-4afa290b1a6b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2t5ZGl2aW5nfGVufDB8fDB8fHww" },
    { name: "Bungee Jumping", img: "https://images.unsplash.com/photo-1559677624-3c956f10d431?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YnVuZ2VlJTIwanVtcGluZ3xlbnwwfHwwfHx8MA%3D%3D" },
    { name: "Camping", img: "https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGNhbXBpbmd8ZW58MHx8MHx8fDA%3D" },
    { name: "Diving", img: "https://images.unsplash.com/photo-1682687981922-7b55dbb30892?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGRpdmluZ3xlbnwwfHwwfHx8MA%3D%3D" },
    { name: "Snorkeling", img: "https://images.unsplash.com/photo-1658298208155-ab71765747a1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c25vcmtlbGluZ3xlbnwwfHwwfHx8MA%3D%3D" },
    { name: "Boat Rides", img: "https://images.unsplash.com/photo-1633892224063-8ef7ff14508f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGJvYXQlMjByaWRlc3xlbnwwfHwwfHx8MA%3D%3D" },
  ];

export default function Activities() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState("All");


  const chips = ["All", "Popular", "Air", "Water", "Mountain", "Calm", "Extreme"];

  const tagOf = (name) => {
    const n = name.toLowerCase();
    if (n.includes("para") || n.includes("sky") || n.includes("bungee")) return "Air";
    if (n.includes("ski") || n.includes("snow") || n.includes("hiking") || n.includes("camp")) return "Mountain";
    if (n.includes("div") || n.includes("snork") || n.includes("boat") || n.includes("water") || n.includes("raft") || n.includes("fish") || n.includes("sail")) return "Water";
    if (n.includes("pilgrimage") || n.includes("horse")) return "Calm";
    if (n.includes("quad") || n.includes("bungee") || n.includes("skydiv")) return "Extreme";
    return "Popular";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = activities;

    if (activeChip !== "All") {
      list = list.filter((a) => tagOf(a.name) === activeChip || (activeChip === "Popular" && tagOf(a.name) === "Popular"));
    }

    if (q) list = list.filter((a) => a.name.toLowerCase().includes(q));

    return list;
  }, [activities, search, activeChip]);

  const featured = useMemo(() => {
    const picks = ["Hiking", "Paragliding", "Rafting"];
    return activities.filter((a) => picks.includes(a.name));
  }, [activities]);

  // ====== STYLES ======
  const page = {
    width: "100%",
    minHeight: "100vh",
    padding: "18px 16px 60px",
    background:
      "radial-gradient(1200px 500px at 20% -10%, rgba(0,255,176,0.22), rgba(0,0,0,0) 60%)," +
      "radial-gradient(900px 420px at 100% 20%, rgba(0,185,255,0.18), rgba(0,0,0,0) 55%)," +
      "linear-gradient(to bottom, #03140f, #020c08, #000000)",
    color: "#eafff7",
    boxSizing: "border-box",
  };

  const max = { maxWidth: 1150, margin: "0 auto" };

  const hero = {
    position: "relative",
    borderRadius: 24,
    overflow: "hidden",
    height: 260,
    marginBottom: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.75)",
  };

  const heroImg = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "saturate(1.15) contrast(1.05) brightness(0.85)",
    transform: "scale(1.06)",
  };

  const heroShade = {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(900px 360px at 50% 10%, rgba(0,255,176,0.22), rgba(0,0,0,0) 60%)," +
      "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.82) 70%, rgba(0,0,0,0.92) 100%)",
  };

  const heroTop = {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  };

  const badge = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(14px)",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(210,255,230,0.92)",
  };

  const heroTitleWrap = {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
  };

  const heroTitle = {
    margin: 0,
    fontSize: 38,
    fontWeight: 900,
    lineHeight: 1.05,
    color: "white",
    textShadow: "0 10px 40px rgba(0,0,0,0.85)",
  };

  const heroSub = {
    marginTop: 10,
    maxWidth: 680,
    fontSize: 14,
    lineHeight: 1.5,
    color: "rgba(230,255,240,0.78)",
  };

  const glassRow = {
    display: "grid",
    gridTemplateColumns: "1.3fr 0.7fr",
    gap: 14,
    margin: "18px 0 16px",
  };

  const inputWrap = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.08)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
    backdropFilter: "blur(18px)",
  };

  const input = {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "white",
    fontSize: 16,
  };

  const metaBox = {
    padding: "12px 14px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(135deg, rgba(0,255,176,0.10), rgba(255,255,255,0.06))",
    boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
    backdropFilter: "blur(18px)",
  };

  const metaBig = { fontSize: 18, fontWeight: 900, color: "white" };
  const metaSmall = { marginTop: 4, fontSize: 12, opacity: 0.75 };

  const chipRow = {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 16,
  };

  const chip = (active) => ({
    padding: "8px 12px",
    borderRadius: 999,
    border: `1px solid ${active ? "rgba(0,255,176,0.55)" : "rgba(255,255,255,0.14)"}`,
    background: active ? "rgba(0,255,176,0.10)" : "rgba(0,0,0,0.45)",
    color: active ? "rgba(220,255,240,0.98)" : "rgba(230,255,240,0.78)",
    cursor: "pointer",
    userSelect: "none",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    boxShadow: active ? "0 12px 40px rgba(0,255,176,0.15)" : "none",
    backdropFilter: "blur(14px)",
  });

  const sectionHead = {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    margin: "18px 0 10px",
  };

  const sectionTitle = {
    margin: 0,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "rgba(200,255,230,0.85)",
  };

  const sectionHint = {
    fontSize: 12,
    opacity: 0.7,
  };

  const featuredGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
    marginBottom: 16,
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
  };

  const card = {
    position: "relative",
    height: 210,
    borderRadius: 22,
    overflow: "hidden",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 20px 70px rgba(0,0,0,0.65)",
    transition: "transform 160ms ease, box-shadow 160ms ease",
    background: "rgba(0,0,0,0.35)",
  };

  const cardImg = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "brightness(0.82) saturate(1.05)",
    transform: "scale(1.02)",
  };

  const cardShade = {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(800px 260px at 10% 15%, rgba(0,255,176,0.18), rgba(0,0,0,0) 55%)," +
      "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.92) 100%)",
  };

  const cardTopTag = {
    position: "absolute",
    top: 12,
    left: 12,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: 11,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "rgba(220,255,240,0.92)",
    backdropFilter: "blur(14px)",
  };

  const cardBottom = {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
  };

  const cardTitle = {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    color: "white",
    textShadow: "0 8px 24px rgba(0,0,0,0.85)",
  };

  const cardSub = {
    marginTop: 6,
    marginBottom: 0,
    fontSize: 13,
    lineHeight: 1.45,
    color: "rgba(235,255,245,0.80)",
    textShadow: "0 8px 24px rgba(0,0,0,0.85)",
  };

  const ctaRow = {
    display: "flex",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
  };

  const cta = {
    padding: "9px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.55)",
    color: "rgba(230,255,240,0.85)",
    fontSize: 12,
    cursor: "pointer",
    backdropFilter: "blur(14px)",
  };

  const dot = { width: 6, height: 6, borderRadius: 99, background: "rgba(0,255,176,0.8)" };

  const openActivity = (name) => {
    navigate(`/tours?activity=${encodeURIComponent(name)}`);
  };

  const Card = ({ a, featured = false }) => {
    const tag = tagOf(a.name);
    return (
      <div
        onClick={() => openActivity(a.name)}
        style={card}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 26px 90px rgba(0,0,0,0.75)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.boxShadow = "0 20px 70px rgba(0,0,0,0.65)";
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "translateY(-1px) scale(0.99)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
        }}
      >
        <img src={a.img} alt={a.name} style={cardImg} />
        <div style={cardShade} />

        <div style={cardTopTag}>
          <span style={dot} />
          <span>{featured ? "Featured" : tag}</span>
        </div>

        <div style={cardBottom}>
          <h2 style={cardTitle}>{a.name}</h2>
          <p style={cardSub}>
            Discover experiences. Feel nature, meet people, live the moment.
          </p>

          <div style={ctaRow}>
            <div style={cta}>View tours</div>
            <div style={cta}>Best spots</div>
            <div style={cta}>Community</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={page}>
      <div style={max}>
        {/* HERO */}
        <div style={hero}>
          <img
            style={heroImg}
            alt="hero"
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8NHklMjB3YWxscGFwZXJ8ZW58MHx8MHx8fDA%3D"
          />
          <div style={heroShade} />

          <div style={heroTop}>
            <div style={badge}>🌍 Explore • Find • Go</div>
            <div style={badge}>✨ {activities.length} activities</div>
          </div>

          <div style={heroTitleWrap}>
            <h1 style={heroTitle}>
              Explore Activities
              <br />
              all around the world
            </h1>
            <div style={heroSub}>
              Tap an activity and jump straight into tours. The vibe is cinematic,
              the UI is glass, and the world is waiting.
            </div>
          </div>
        </div>

        {/* SEARCH + META */}
        <div style={glassRow}>
          <div style={inputWrap}>
            <div style={{ opacity: 0.9 }}>🔎</div>
            <input
              style={input}
              placeholder="Search activities… (e.g. Hiking, Rafting, Skydiving)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search ? (
              <div
                onClick={() => setSearch("")}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(0,0,0,0.45)",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Clear
              </div>
            ) : null}
          </div>

          <div style={metaBox}>
            <div style={metaBig}>{filtered.length}</div>
            <div style={metaSmall}>matching activities right now</div>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
              Tip: use chips to get “wow” fast.
            </div>
          </div>
        </div>

        {/* CHIPS */}
        <div style={chipRow}>
          {chips.map((c) => (
            <div
              key={c}
              style={chip(activeChip === c)}
              onClick={() => setActiveChip(c)}
            >
              {c}
            </div>
          ))}
        </div>

        {/* FEATURED */}
        <div style={sectionHead}>
          <h3 style={sectionTitle}>Featured picks</h3>
          <div style={sectionHint}>Hand-picked cinematic experiences</div>
        </div>
        <div style={featuredGrid}>
          {featured.map((a) => (
            <Card key={a.name} a={a} featured />
          ))}
        </div>

        {/* ALL */}
        <div style={sectionHead}>
          <h3 style={sectionTitle}>All activities</h3>
          <div style={sectionHint}>
            Click an activity → opens tours filtered by that activity
          </div>
        </div>

        <div style={grid}>
          {filtered.map((a) => (
            <Card key={a.name} a={a} />
          ))}
        </div>
      </div>
    </div>
  );
}