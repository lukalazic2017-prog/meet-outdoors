import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { sendNotification } from "../utils/sendNotification";

export default function RatingModal({ userId, onClose }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  async function submitRating() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return alert("You must be logged in.");

    if (stars === 0) return alert("Select a rating!");

    // Sacuvaj ocenu u DB
    const { error } = await supabase.from("profile_ratings").insert({
      profile_id: userId,
      rater_id: auth.user.id,
      rating: stars,
      comment,
    });

    if (error) {
      console.log(error);
      return alert("Error while rating.");
    }

    // 📢 Notifikacija korisniku
    await sendNotification(
      userId,
      "New rating",
      "Someone rated your profile",
      `/profile/${userId}`
    );

    alert("Rating sent!");
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "380px",
          background: "#0d1f17",
          padding: "20px",
          borderRadius: "16px",
          color: "white",
          boxShadow: "0 0 20px rgba(0,0,0,0.4)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
          Rate this user
        </h2>

        {/* ZVEZDICE */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              onClick={() => setStars(s)}
              style={{
                cursor: "pointer",
                fontSize: "28px",
                color: s <= stars ? "#00ff99" : "#555",
              }}
            >
              ★
            </span>
          ))}
        </div>

        <textarea
          placeholder="Write a comment (optional)"
          style={{
            width: "100%",
            background: "#132921",
            border: "none",
            borderRadius: "10px",
            padding: "10px",
            color: "white",
            marginBottom: "15px",
            height: "80px",
          }}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button
          onClick={submitRating}
          style={{
            width: "100%",
            padding: "10px",
            background: "linear-gradient(135deg,#00ff9c,#00995c)",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "700",
            color: "#00361d",
            marginBottom: "10px",
          }}
        >
          Submit rating
        </button>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "10px",
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            color: "white",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}