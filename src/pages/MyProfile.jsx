import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [myTours, setMyTours] = useState([]);
  const [joinedTours, setJoinedTours] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadEverything();
  }, []);

  async function loadEverything() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      navigate("/login");
      return;
    }

    const user = sessionData.session.user;

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setProfile(profileData);

    // Load tours created by user
    const { data: tours } = await supabase
      .from("tours")
      .select("*")
      .eq("owner_id", user.id);

    setMyTours(tours || []);

    // Load joined tours
    const { data: joined } = await supabase
      .from("tour_registrations")
      .select(", tours()")
      .eq("user_id", user.id);

    setJoinedTours(joined || []);

    // Load received reviews
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewed_user_id", user.id)
      .limit(3)
      .order("created_at", { ascending: false });

    setReviews(reviewsData || []);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  if (loading) {
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
        Loading…
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: "center", padding: "80px", color: "white" }}>
        <h2>❌ Profil nije pronađen</h2>
        <button
          onClick={() => navigate("/edit-profile")}
          style={{
            padding: "14px 24px",
            background: "#13c46b",
            borderRadius: "10px",
            border: "none",
            fontSize: "17px",
            color: "white",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          ➕ Kreiraj profil
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #04121f, #062b22, #04121f)",
        color: "white",
        padding: "30px",
      }}
    >
      {/* ---- PROFILE HEADER ---- */}
      <div
        style={{
          maxWidth: "500px",
          margin: "0 auto",
          textAlign: "center",
          background: "rgba(255,255,255,0.06)",
          padding: "25px",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        <img
          src={
            profile.avatar_url
              ? profile.avatar_url
              : `https://ui-avatars.com/api/?name=${profile.full_name}&background=13c46b&color=fff&size=200`
          }
          style={{
            width: "130px",
            height: "130px",
            borderRadius: "50%",
            border: "3px solid #13c46b",
            objectFit: "cover",
            marginBottom: "20px",
          }}
        />

        <h2 style={{ marginBottom: "5px", fontSize: "26px" }}>
          {profile.full_name}
        </h2>
        <p style={{ opacity: 0.8, marginBottom: "15px" }}>@ID: {profile.id}</p>

        <p style={{ fontSize: "15px", opacity: 0.9 }}>{profile.bio || "—"}</p>

        <button
          onClick={() => navigate("/edit-profile")}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "12px",
            background: "#13c46b",
            borderRadius: "10px",
            border: "none",
            fontSize: "16px",
            cursor: "pointer",
            color: "white",
          }}
        >
          ✏️ Uredi profil
        </button>

        <button
          onClick={logout}
          style={{
            marginTop: "10px",
            width: "100%",
            padding: "12px",
            background: "#e04646",
            borderRadius: "10px",
            border: "none",
            fontSize: "16px",
            cursor: "pointer",
            color: "white",
          }}
        >
          🚪 Odjavi se
        </button>
      </div>

      {/* ---- STATS ---- */}
      <div
        style={{
          marginTop: "40px",
          display: "flex",
          justifyContent: "space-around",
          maxWidth: "500px",
          marginInline: "auto",
          textAlign: "center",
        }}
      >
        <div>
          <h3>{myTours.length}</h3>
          <p style={{ opacity: 0.7 }}>Kreirane ture</p>
        </div>
        <div>
          <h3>{joinedTours.length}</h3>
          <p style={{ opacity: 0.7 }}>Prijavljen</p>
        </div>
        <div>
          <h3>{reviews.length}</h3>
          <p style={{ opacity: 0.7 }}>Recenzije</p>
        </div>
      </div>

      {/* ---- MY TOURS ---- */}
      <h2 style={{ marginTop: "40px" }}>📌 Moje Ture</h2>

      {myTours.length === 0 ? (
        <p style={{ opacity: 0.7 }}>Nema kreiranih tura.</p>
      ) : (
        <div
          style={{
            marginTop: "15px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
          }}
        >
          {myTours.map((t) => (
            <div
              key={t.id}
              style={{
                background: "rgba(255,255,255,0.07)",
                borderRadius: "12px",
                padding: "10px",
                cursor: "pointer",
              }}
              onClick={() => navigate(`/tour/${t.id}`)}
            >
              <img
                src={t.image_url}
                style={{
                  width: "100%",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "10px",
                }}
              />
              <p style={{ marginTop: "8px" }}>{t.title}</p>
            </div>
          ))}
        </div>
      )}

      {/* ---- JOINED TOURS ---- */}
      <h2 style={{ marginTop: "40px" }}>🧭 Ture na koje si prijavljen</h2>

      {joinedTours.length === 0 ? (
        <p style={{ opacity: 0.7 }}>Nisi prijavljen ni na jednu turu.</p>
      ) : (
        <div
          style={{
            marginTop: "15px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
          }}
        >
          {joinedTours.map((j) => (
            <div
              key={j.id}
              style={{
                background: "rgba(255,255,255,0.07)",
                borderRadius: "12px",
                padding: "10px",
                cursor: "pointer",
              }}
              onClick={() => navigate(`/tour/${j.tours.id}`)}
            >
              <img
                src={j.tours.image_url}
                style={{
                  width: "100%",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "10px",
                }}
              />
              <p style={{ marginTop: "8px" }}>{j.tours.title}</p>
            </div>
          ))}
        </div>
      )}

      {/* ---- REVIEWS ---- */}
      <h2 style={{ marginTop: "40px" }}>⭐ Recenzije o tebi</h2>

      {reviews.length === 0 ? (
        <p style={{ opacity: 0.7 }}>Nema recenzija.</p>
      ) : (
        reviews.map((r) => (
          <div
            key={r.id}
            style={{
              background: "rgba(255,255,255,0.07)",
              padding: "15px",
              borderRadius: "12px",
              marginTop: "10px",
            }}
          >
            <strong>Ocena: ⭐ {r.rating}</strong>
            <p style={{ marginTop: "8px" }}>{r.text}</p>
          </div>
        ))
      )}
    </div>
  );
}