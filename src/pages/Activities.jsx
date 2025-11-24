import React from "react";
import { Link } from "react-router-dom";

const activities = [
  {
    name: "Planinarenje",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    desc: "Otkrij skrivene staze i planinske vrhove koji oduzimaju dah.",
  },
  {
    name: "Biciklizam",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
    desc: "Vozi kroz prirodu i oseti vetar u kosi dok istražuješ svet na dva točka.",
  },
  {
    name: "Vožnja kvadom",
    image:
      "https://images.unsplash.com/photo-1627068007054-0f1a4a9f1e02?auto=format&fit=crop&w=1200&q=80",
    desc: "Blato, brzina i avantura — idealno za ljubitelje adrenalina.",
  },
  {
    name: "Rafting",
    image:
      "https://images.unsplash.com/photo-1602546127375-7c073d08b498?auto=format&fit=crop&w=1200&q=80",
    desc: "Brza voda i jak timski duh — nezaboravno iskustvo!",
  },
  {
    name: "Skijanje",
    image:
      "https://images.unsplash.com/photo-1516569422865-0b7e1b06e90d?auto=format&fit=crop&w=1200&q=80",
    desc: "Zimska čarolija i uzbuđenje na snežnim padinama.",
  },
  {
    name: "Skijanje na vodi",
    image:
      "https://images.unsplash.com/photo-1604948501466-97b9a9a59e5d?auto=format&fit=crop&w=1200&q=80",
    desc: "Leti po vodi, oseti slobodu i brzinu pod suncem.",
  },
  {
    name: "Paraglajding",
    image:
      "https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?auto=format&fit=crop&w=1200&q=80",
    desc: "Poleti i doživi svet iz ptičje perspektive — čista sloboda!",
  },
  {
    name: "Padobranstvo",
    image:
      "https://images.unsplash.com/photo-1504366266557-3e2e1bc87c9a?auto=format&fit=crop&w=1200&q=80",
    desc: "Adrenalin koji se pamti ceo život. Samo za hrabre.",
  },
  {
    name: "Bungee Jumping",
    image:
      "https://images.unsplash.com/photo-1558980664-10ea2927f1e9?auto=format&fit=crop&w=1200&q=80",
    desc: "Skok vere — slobodan pad i trenutak potpunog adrenalina.",
  },
  {
    name: "Ronjenje",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    desc: "Zaronite u tihi svet dubina i otkrijte magiju podvodnog života.",
  },
  {
    name: "Kampovanje",
    image:
      "https://images.unsplash.com/photo-1504274066651-8d31a536b11a?auto=format&fit=crop&w=1200&q=80",
    desc: "Logorska vatra, miris šume i zvezde iznad — priroda u punom sjaju.",
  },
  {
    name: "Hodočašće",
    image:
      "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=1200&q=80",
    desc: "Duhovno putovanje kroz prirodu i tišinu koje donosi mir duši.",
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
        🌍 Aktivnosti u prirodi
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
        Izaberi avanturu i otkrij svet pun uzbuđenja, prirode i slobode.  
        Od planina do okeana — sve je u tvojim rukama.
      </p>

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
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 10px 35px rgba(0,0,0,0.4)",
              transform: "scale(1)",
              transition: "transform 0.4s ease, box-shadow 0.4s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 15px 45px rgba(0,0,0,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 10px 35px rgba(0,0,0,0.4)";
            }}
          >
            <img
              src={a.image}
              alt={a.name}
              style={{
                width: "100%",
                height: "250px",
                objectFit: "cover",
                filter: "brightness(90%) contrast(110%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                padding: "20px",
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.75))",
                backdropFilter: "blur(6px)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.6rem",
                  fontWeight: "bold",
                  marginBottom: "10px",
                  textShadow: "0 3px 10px rgba(0,0,0,0.8)",
                }}
              >
                {a.name}
              </h2>
              <p style={{ fontSize: "1rem", opacity: 0.9 }}>{a.desc}</p>

              <Link to={`/tours?activity=${a.name}`}>
                <button
                  style={{
                    marginTop: "15px",
                    background:
                      "linear-gradient(90deg, #22c55e, #4ade80, #16a34a)",
                    color: "#06290f",
                    fontWeight: "bold",
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px 22px",
                    cursor: "pointer",
                    transition: "0.3s ease",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.background = "#4ade80")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.background =
                      "linear-gradient(90deg, #22c55e, #4ade80, #16a34a)")
                  }
                >
                  Pogledaj ture
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