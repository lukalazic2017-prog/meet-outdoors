import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const activities = [
  {
    name: "Hiking",
    img: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aGlraW5nfGVufDB8fDB8fHww",
  },
  {
    name: "Cycling",
    img: "https://images.unsplash.com/photo-1534146789009-76ed5060ec70?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y3ljbGluZ3xlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    name: "Paragliding",
    img: "https://images.unsplash.com/photo-1719949122509-74d0a1d08b44?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cGFyYWdsaWRpbmd8ZW58MHx8MHx8fDA%3D",
  },
  {
    name: "Parasailing",
    img: "https://images.unsplash.com/photo-1560419656-c2fe828696af?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cGFyYXNhaWxpbmd8ZW58MHx8MHx8fDA%3D",
  },
  {
    name: "Running / Marathon",
    img: "https://images.unsplash.com/photo-1547483238-f400e65ccd56?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHJ1bm5pbmd8ZW58MHx8MHx8fDA%3D",
  },
  {
    name: "Pilgrimage",
    img: "https://images.unsplash.com/photo-1616244013240-227ec9abfefb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aG9seXxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    name: "Horse Riding",
    img: "https://images.unsplash.com/photo-1589400867230-3491ceee2934?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGhvcnNlJTIwcmlkaW5nfGVufDB8fDB8fHww",
  },
  {
    name: "Fishing",
    img: "https://images.unsplash.com/photo-1493787039806-2edcbe808750?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGZpc2hpbmd8ZW58MHx8MHx8fDA%3D",
  },
  {
    name: "Rafting",
    img: "https://images.unsplash.com/photo-1642933196504-62107dac9258?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cmFmdGluZ3xlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    name: "Quad Riding",
    img: "https://plus.unsplash.com/premium_photo-1698670081064-4b3103e04ba6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fHF1YWR8ZW58MHx8MHx8fDA%3D",
  },
  {
    name: "Skiing & Snowboarding",
    img: "https://images.unsplash.com/photo-1614358606268-aa86853578b4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHNraWlzJTIwYW5kJTIwc25vd2JvYXJkcyUyMGVxdWlwbW1lbnR8ZW58MHx8MHx8fDA%3D",
  },
  {
    name: "Water Skiing",
    img: "https://images.unsplash.com/photo-1627319706385-dfde6ea09e4e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHdhdGVyJTIwc2tpaW5nfGVufDB8fDB8fHww",
  },
  {
    name: "Skydiving",
    img: "https://images.unsplash.com/photo-1630879937467-4afa290b1a6b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2t5ZGl2aW5nfGVufDB8fDB8fHww",
  },
  {
    name: "Bungee Jumping",
    img: "https://images.unsplash.com/photo-1559677624-3c956f10d431?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YnVuZ2VlJTIwanVtcGluZ3xlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    name: "Camping",
    img: "https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGNhbXBpbmd8ZW58MHx8MHx8fDA%3D",
  },
  {
    name: "Diving",
    img: "https://images.unsplash.com/photo-1682687981922-7b55dbb30892?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGRpdmluZ3xlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    name: "Snorkeling",
    img: "https://images.unsplash.com/photo-1658298208155-ab71765747a1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c25vcmtlbGluZ3xlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    name: "Boat Rides",
    img: "https://images.unsplash.com/photo-1633892224063-8ef7ff14508f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGJvYXQlMjByaWRlc3xlbnwwfHwwfHx8MA%3D%3D",
  },
];

export default function Activities() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState("All");
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const chips = ["All", "Popular", "Air", "Water", "Mountain", "Calm", "Extreme"];

  const tagOf = (name) => {
    const n = name.toLowerCase();
    if (n.includes("para") || n.includes("sky") || n.includes("bungee")) return "Air";
    if (n.includes("ski") || n.includes("snow") || n.includes("hiking") || n.includes("camp")) return "Mountain";
    if (
      n.includes("div") ||
      n.includes("snork") ||
      n.includes("boat") ||
      n.includes("water") ||
      n.includes("raft") ||
      n.includes("fish") ||
      n.includes("sail")
    ) return "Water";
    if (n.includes("pilgrimage") || n.includes("horse")) return "Calm";
    if (n.includes("quad") || n.includes("bungee") || n.includes("skydiv")) return "Extreme";
    return "Popular";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = activities;

    if (activeChip !== "All") {
      list = list.filter(
        (a) =>
          tagOf(a.name) === activeChip ||
          (activeChip === "Popular" && tagOf(a.name) === "Popular")
      );
    }

    if (q) list = list.filter((a) => a.name.toLowerCase().includes(q));

    return list;
  }, [search, activeChip]);

  const featured = useMemo(() => {
    const picks = ["Hiking", "Paragliding", "Rafting"];
    return activities.filter((a) => picks.includes(a.name));
  }, []);

  const page = {
    width: "100%",
    minHeight: "100vh",
    padding: isMobile ? "0 0 92px" : "0 0 60px",
    marginTop: -120,
    background:
      "radial-gradient(1200px 520px at 15% -8%, rgba(0,255,176,0.18), rgba(0,0,0,0) 60%)," +
      "radial-gradient(1000px 480px at 100% 12%, rgba(0,185,255,0.14), rgba(0,0,0,0) 55%)," +
      "radial-gradient(900px 460px at 50% 100%, rgba(124,77,255,0.12), rgba(0,0,0,0) 55%)," +
      "linear-gradient(to bottom, #041711, #020d09, #000000)",
    color: "#eafff7",
    boxSizing: "border-box",
    overflowX: "hidden",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const max = {
    maxWidth: 1240,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
    overflowX: "hidden",
    padding: isMobile ? "0 12px" : "0 16px",
  };

  const hero = {
    position: "relative",
    borderRadius: isMobile ? "0 0 30px 30px" : "0 0 28px 28px",
    overflow: "hidden",
    minHeight: isMobile ? 420 : 330,
    height: isMobile ? "auto" : 330,
    marginBottom: isMobile ? 18 : 22,
    border: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)",
    borderTop: "none",
    boxShadow: "0 34px 100px rgba(0,0,0,0.72)",
  };

  const heroImg = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "saturate(1.15) contrast(1.06) brightness(0.82)",
    transform: "scale(1.08)",
  };

  const heroShade = {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(800px 360px at 20% 0%, rgba(0,255,176,0.20), rgba(0,0,0,0) 60%)," +
      "radial-gradient(700px 320px at 85% 10%, rgba(0,185,255,0.16), rgba(0,0,0,0) 60%)," +
      "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0.90) 100%)",
  };

  const heroNoise = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
    opacity: 0.18,
    pointerEvents: "none",
  };

  const heroTop = {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: isMobile ? "flex-start" : "center",
    gap: 10,
    flexWrap: "wrap",
    zIndex: 2,
  };

  const badge = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: isMobile ? "7px 11px" : "8px 12px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.42)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(16px)",
    fontSize: isMobile ? 11 : 12,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "rgba(210,255,230,0.96)",
    maxWidth: "100%",
    boxSizing: "border-box",
    boxShadow: "0 12px 30px rgba(0,0,0,0.24)",
  };

  const heroTitleWrap = {
    position: "absolute",
    left: isMobile ? 16 : 22,
    right: isMobile ? 16 : 22,
    bottom: isMobile ? 18 : 22,
    zIndex: 2,
  };

  const heroTitle = {
    margin: 0,
    fontSize: isMobile ? 38 : 56,
    fontWeight: 1000,
    lineHeight: isMobile ? 0.98 : 0.92,
    color: "white",
    textShadow: "0 14px 44px rgba(0,0,0,0.88)",
    letterSpacing: "-0.05em",
    wordBreak: "break-word",
    maxWidth: 900,
  };

  const heroSub = {
    marginTop: 12,
    maxWidth: 760,
    fontSize: isMobile ? 13 : 15,
    lineHeight: 1.6,
    color: "rgba(230,255,240,0.82)",
    textShadow: "0 8px 22px rgba(0,0,0,0.82)",
  };

  const heroMetrics = {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  };

  const heroMetric = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 12px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.42)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(238,255,245,0.92)",
    fontSize: 12,
    fontWeight: 800,
    backdropFilter: "blur(14px)",
  };

  const glassRow = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1.35fr 0.65fr",
    gap: 14,
    margin: isMobile ? "0 0 16px" : "0 0 18px",
    width: "100%",
  };

  const inputWrap = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: isMobile ? "13px 13px" : "14px 16px",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.08)",
    boxShadow: "0 22px 70px rgba(0,0,0,0.48)",
    backdropFilter: "blur(18px)",
    width: "100%",
    boxSizing: "border-box",
    minWidth: 0,
  };

  const input = {
    width: "100%",
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "white",
    fontSize: isMobile ? 15 : 16,
    fontWeight: 600,
  };

  const metaBox = {
    padding: isMobile ? "14px 15px" : "14px 16px",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(135deg, rgba(0,255,176,0.10), rgba(255,255,255,0.06))",
    boxShadow: "0 22px 70px rgba(0,0,0,0.48)",
    backdropFilter: "blur(18px)",
    width: "100%",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  };

  const metaGlow = {
    position: "absolute",
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,255,176,0.18), transparent 70%)",
    pointerEvents: "none",
  };

  const metaBig = {
    fontSize: isMobile ? 18 : 22,
    fontWeight: 1000,
    color: "white",
    letterSpacing: "-0.03em",
    position: "relative",
    zIndex: 1,
  };

  const metaSmall = {
    marginTop: 5,
    fontSize: 12,
    opacity: 0.78,
    position: "relative",
    zIndex: 1,
  };

  const chipRow = {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 18,
  };

  const chip = (active) => ({
    padding: isMobile ? "9px 13px" : "9px 14px",
    borderRadius: 999,
    border: `1px solid ${
      active ? "rgba(0,255,176,0.50)" : "rgba(255,255,255,0.14)"
    }`,
    background: active ? "rgba(0,255,176,0.10)" : "rgba(0,0,0,0.42)",
    color: active ? "rgba(220,255,240,0.98)" : "rgba(230,255,240,0.78)",
    cursor: "pointer",
    userSelect: "none",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    boxShadow: active ? "0 12px 40px rgba(0,255,176,0.12)" : "none",
    backdropFilter: "blur(14px)",
    transition: "all .18s ease",
  });

  const sectionHead = {
    display: "flex",
    alignItems: isMobile ? "flex-start" : "flex-end",
    justifyContent: "space-between",
    gap: 12,
    flexDirection: isMobile ? "column" : "row",
    margin: "22px 0 12px",
  };

  const sectionTitle = {
    margin: 0,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "rgba(200,255,230,0.88)",
    fontWeight: 900,
  };

  const sectionHint = {
    fontSize: 12,
    opacity: 0.72,
    color: "rgba(230,255,240,0.78)",
  };

  const featuredGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
    gap: 16,
    marginBottom: 18,
    width: "100%",
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
    width: "100%",
  };

  const card = {
    position: "relative",
    height: isMobile ? 250 : 240,
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 24px 74px rgba(0,0,0,0.58)",
    transition: "transform 180ms ease, box-shadow 180ms ease",
    background: "rgba(0,0,0,0.35)",
    boxSizing: "border-box",
  };

  const cardImg = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "brightness(0.82) saturate(1.08)",
    transform: "scale(1.03)",
  };

  const cardShade = {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(700px 260px at 12% 10%, rgba(0,255,176,0.16), rgba(0,0,0,0) 55%)," +
      "radial-gradient(520px 220px at 90% 0%, rgba(0,185,255,0.14), rgba(0,0,0,0) 50%)," +
      "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.58) 54%, rgba(0,0,0,0.92) 100%)",
  };

  const cardTopTag = {
    position: "absolute",
    top: 12,
    left: 12,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 11px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.48)",
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "rgba(220,255,240,0.94)",
    backdropFilter: "blur(14px)",
    maxWidth: "calc(100% - 24px)",
    boxSizing: "border-box",
    boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
  };

  const cardBottom = {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
  };

  const cardTitle = {
    margin: 0,
    fontSize: isMobile ? 21 : 21,
    fontWeight: 1000,
    color: "white",
    textShadow: "0 8px 24px rgba(0,0,0,0.85)",
    letterSpacing: "-0.03em",
    wordBreak: "break-word",
  };

  const cardSub = {
    marginTop: 7,
    marginBottom: 0,
    fontSize: 13,
    lineHeight: 1.5,
    color: "rgba(235,255,245,0.82)",
    textShadow: "0 8px 24px rgba(0,0,0,0.85)",
    maxWidth: "95%",
  };

  const ctaRow = {
    display: "flex",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  };

  const cta = {
    padding: "9px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.48)",
    color: "rgba(230,255,240,0.88)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    backdropFilter: "blur(14px)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.16)",
  };

  const featuredRibbon = {
    position: "absolute",
    top: 12,
    right: 12,
    padding: "7px 11px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    backdropFilter: "blur(14px)",
  };

  const dot = {
    width: 6,
    height: 6,
    borderRadius: 99,
    background: "rgba(0,255,176,0.88)",
    boxShadow: "0 0 12px rgba(0,255,176,0.55)",
  };

  const emptyWrap = {
    marginTop: 12,
    padding: isMobile ? "22px 16px" : "26px 20px",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 22px 70px rgba(0,0,0,0.42)",
    backdropFilter: "blur(18px)",
    textAlign: "center",
  };

  const openActivity = (name) => {
    navigate(`/tours?activity=${encodeURIComponent(name)}`);
  };

  const Card = ({ a, featured = false }) => {
    const tag = tagOf(a.name);

    return (
      <div
        onClick={() => openActivity(a.name)}
        style={{
          ...card,
          height: featured && !isMobile ? 280 : card.height,
        }}
        onMouseEnter={(e) => {
          if (isMobile) return;
          e.currentTarget.style.transform = "translateY(-6px)";
          e.currentTarget.style.boxShadow = "0 30px 96px rgba(0,0,0,0.72)";
        }}
        onMouseLeave={(e) => {
          if (isMobile) return;
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.boxShadow = "0 24px 74px rgba(0,0,0,0.58)";
        }}
        onMouseDown={(e) => {
          if (isMobile) return;
          e.currentTarget.style.transform = "translateY(-2px) scale(0.992)";
        }}
        onMouseUp={(e) => {
          if (isMobile) return;
          e.currentTarget.style.transform = "translateY(-6px)";
        }}
      >
        <img src={a.img} alt={a.name} style={cardImg} />
        <div style={cardShade} />

        <div style={cardTopTag}>
          <span style={dot} />
          <span>{featured ? "Featured" : tag}</span>
        </div>

        {featured && <div style={featuredRibbon}>Top pick</div>}

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
        <div style={hero}>
          <img
            style={heroImg}
            alt="hero"
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8NHklMjB3YWxscGFwZXJ8ZW58MHx8MHx8fDA%3D"
          />
          <div style={heroShade} />
          <div style={heroNoise} />

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

            <div style={heroMetrics}>
              <div style={heroMetric}>⚡ {filtered.length} ready now</div>
              <div style={heroMetric}>🌄 Nature-first experiences</div>
              <div style={heroMetric}>🧭 Open activity paths</div>
            </div>
          </div>
        </div>

        <div style={glassRow}>
          <div style={inputWrap}>
            <div style={{ opacity: 0.92, flexShrink: 0, fontSize: 16 }}>🔎</div>
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
                  padding: "7px 11px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(0,0,0,0.45)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                Clear
              </div>
            ) : null}
          </div>

          <div style={metaBox}>
            <div style={metaGlow} />
            <div style={metaBig}>{filtered.length}</div>
            <div style={metaSmall}>matching activities right now</div>
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                opacity: 0.78,
                position: "relative",
                zIndex: 1,
              }}
            >
              Tip: use chips to get “wow” fast.
            </div>
          </div>
        </div>

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

        <div style={sectionHead}>
          <h3 style={sectionTitle}>Featured picks</h3>
          <div style={sectionHint}>Hand-picked cinematic experiences</div>
        </div>

        <div style={featuredGrid}>
          {featured.map((a) => (
            <Card key={a.name} a={a} featured />
          ))}
        </div>

        <div style={sectionHead}>
          <h3 style={sectionTitle}>All activities</h3>
          <div style={sectionHint}>
            Click an activity → opens tours filtered by that activity
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={emptyWrap}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "white",
                letterSpacing: "-0.02em",
              }}
            >
              No activities found
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                opacity: 0.76,
                lineHeight: 1.55,
              }}
            >
              Try another keyword or switch the filter chip to open more options.
            </div>
          </div>
        ) : (
          <div style={grid}>
            {filtered.map((a) => (
              <Card key={a.name} a={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}