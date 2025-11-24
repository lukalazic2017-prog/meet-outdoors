import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./EditProfile.css";

export default function EditProfile() {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      navigate("/login");
      return;
    }

    const user = sessionData.session.user;

    const { data: profile } = await supabase
      .from("profiles")      // ← OVO JE KLJUČNO!
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setFullName(profile.full_name || "");
      setAge(profile.age || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
      setPreview(profile.avatar_url || null);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session.user;

    const ext = file.name.split(".").pop();
    const fileName = `${user.id}.${ext}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("Greška pri uploadu slike!");
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    setAvatarUrl(publicUrl.publicUrl);
  }

  async function saveProfile() {
  if (!avatarUrl) {
    alert("Profilna slika je obavezna. Molim te dodaj sliku lica.");
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session.user;

  const profileData = {
    user_id: user.id,
    full_name: fullName,
    age: age,
    bio: bio,
    avatar_url: avatarUrl,
  };



    const { data: existing } = await supabase
      .from("profiles")          // ← opet KLJUČNO
      .select("*")
      .eq("user_id", user.id)
      .single();

    let error;

    if (existing) {
      const { error: updateErr } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("user_id", user.id);
      error = updateErr;
    } else {
      const { error: insertErr } = await supabase
        .from("profiles")
        .insert(profileData);
      error = insertErr;
    }

    if (error) {
      alert("Greška pri čuvanju profila.");
    } else {
      alert("Profil uspešno sačuvan!");
      navigate("/my-profile");
    }
  }

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-card">
        <h2>Uredi Profil</h2>

        <div className="avatar-section">
          {preview ? (
            <img src={preview} alt="avatar" className="avatar-preview" />
          ) : (
            <div className="avatar-placeholder">Nema slike</div>
          )}

          <label className="label">Profilna slika:</label>
          <input
            type="file"
            accept="image/*"
            className="input-profile"
            onChange={handleFileChange}
          />
        </div>

        <label className="label">Ime i prezime:</label>
        <input
          className="input-profile"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <label className="label">Godine:</label>
        <input
          className="input-profile"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />

        <label className="label">Opis:</label>
        <textarea
          className="input-profile"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        ></textarea>

        <button className="save-btn" onClick={saveProfile}>
          💾 Sačuvaj
        </button>
      </div>
    </div>
  );
}