import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Activities() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

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

  const filtered = activities.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: "100%",
      minHeight: "100vh",
      padding: "20px",
      background: "linear-gradient(to bottom, #03140f, #020c08, #000000)",
      color: "#eafff7"
    }}>
      
      <div style={{
        width: "100%",
        height: 230,
        borderRadius: 20,
        backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1500')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        marginBottom: 25,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: 25,
        position: "relative"
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)"
        }}></div>

        <h1 style={{
          position: "relative",
          fontSize: 36,
          fontWeight: 800,
          color: "white",
          textShadow: "0 3px 10px black"
        }}>
          Explore Activities  
        </h1>
      </div>

      <input
        style={{
          width: "100%",
          padding: "14px 18px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.08)",
          color: "white",
          marginBottom: 25,
          fontSize: 16
        }}
        placeholder="Search activities..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 20
      }}>
        {filtered.map((a, i) => (
          <div key={i}
            onClick={() => navigate(`/tours?activity=${a.name}`)}
            style={{
              position: "relative",
              height: 200,
              borderRadius: 18,
              overflow: "hidden",
              cursor: "pointer",
              transition: "0.25s",
              boxShadow: "0 4px 14px rgba(0,0,0,0.45)"
            }}
          >
            <img src={a.img} alt={a.name} style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.82)"
            }} />

            <div style={{ position: "absolute", bottom: 12, left: 12 }}>
              <h2 style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                textShadow: "0 2px 6px black"
              }}>{a.name}</h2>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
                Discover outdoor experiences
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}