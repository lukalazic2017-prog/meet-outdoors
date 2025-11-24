import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop";
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1200&auto=format&fit=crop";

export default function MyTours() {
  const [tours, setTours] = useState([]);

  useEffect(() => {
    const allTours = JSON.parse(localStorage.getItem("tours")) || [];
    const signed = allTours.filter((t) => t.signedUp);
    setTours(signed);
  }, []);

  const handleCancel = (id) => {
    const allTours = JSON.parse(localStorage.getItem("tours")) || [];
    const updated = allTours.map((t) =>
      t.id === id ? { ...t, signedUp: false } : t
    );
    localStorage.setItem("tours", JSON.stringify(updated));
    setTours(updated.filter((t) => t.signedUp));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0f172a, #14532d, #166534)",
        color: "white",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* HERO */}
      <section
        style={{
          position: "relative",
          height: "40vh",
          backgroundImage: `linear-gradient(180deg, rgba(10,40,20,0.75), rgba(10,40,20,0.85)), url(${HERO_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          boxShadow: "inset 0 -40px 80px rgba(0,0,0,0.4)",
        }}
      >
        <h1
          style={{
            fontSize: "3rem",
            marginBottom: "10px",
            fontWeight: 700,
            background: "linear-gradient(90deg, #4ade80, #22c55e, #16a34a)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Moje avanture
        </h1>
        <p style={{ opacity: 0.9, fontSize: "1.1rem" }}>
          Pregled svih tura na koje si se prijavio.
        </p>
      </section>

      {/* SADRŽAJ */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "50px 20px",
        }}
      >
        {tours.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              marginTop: "60px",
              padding: "40px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "20px",
              boxShadow: "0 15px 40px rgba(0,0,0,0.4)",
            }}
          >
            <h2 style={{ fontSize: "2rem", marginBottom: "10px" }}>
              Još nisi krenuo ni na jednu avanturu 🏔️
            </h2>
            <p style={{ opacity: 0.85, marginBottom: "25px" }}>
              Svaka velika priča počinje prvim korakom.
            </p>
            <Link
              to="/tours"
              style={{
                background: "linear-gradient(135deg, #22c55e, #15803d)",
                padding: "12px 25px",
                borderRadius: "10px",
                textDecoration: "none",
                color: "white",
                fontWeight: "bold",
                boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
              }}
            >
              🔎 Istraži ture
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "25px",
            }}
          >
            {tours.map((t, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow: "0 20px 45px rgba(0,0,0,0.5)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div
                  style={{
                    height: "180px",
                    backgroundImage: `url(${t.image || FALLBACK_IMG})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.35))",
                    }}
                  ></div>
                  <span
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      background: "rgba(0,0,0,0.45)",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      textTransform: "capitalize",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    {t.activity || "aktivnost"}
                  </span>
                </div>
                <div style={{ padding: "18px" }}>
                  <h3 style={{ margin: "0 0 10px", fontSize: "1.3rem" }}>
                    {t.name}
                  </h3>
                  <p style={{ margin: "3px 0", opacity: 0.9 }}>📍 {t.location}</p>
                  <p style={{ margin: "3px 0", opacity: 0.9 }}>
                    📅 {t.date} | ⏱ {t.startTime} - {t.endTime}
                  </p>
                  <p style={{ margin: "3px 0 15px", opacity: 0.9 }}>
                    💰 {t.price} €
                  </p>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      opacity: 0.85,
                      marginBottom: "15px",
                    }}
                  >
                    {t.description.length > 90
                      ? t.description.substring(0, 90) + "..."
                      : t.description}
                  </p>
                  <button
                    onClick={() => handleCancel(t.id)}
                    style={{
                      background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                      border: "none",
                      color: "white",
                      fontWeight: "bold",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      width: "100%",
                      cursor: "pointer",
                      transition: "0.3s ease",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.background =
                        "linear-gradient(135deg, #b91c1c, #991b1b)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.background =
                        "linear-gradient(135deg, #dc2626, #b91c1c)")
                    }
                  >
                    ❌ Odjavi se sa ture
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}