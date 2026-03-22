import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function CreateGoingNow() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [category, setCategory] = useState("chill");
  const [vibe, setVibe] = useState("social");
  const [difficulty, setDifficulty] = useState("easy");
  const [spotsTotal, setSpotsTotal] = useState(6);
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastCreatedId, setLastCreatedId] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg("Title is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const payload = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        location_text: locationText.trim() || null,
        category: category || null,
        vibe: vibe || null,
        difficulty: difficulty || null,
        spots_total: spotsTotal ? Number(spotsTotal) : null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        status: "active",
      };

      const { data, error } = await supabase
        .from("going_now")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        console.error("create error:", error);
        setErrorMsg(error.message || "Could not create live plan.");
        return;
      }

      const newId = data.id;
      setLastCreatedId(newId);

      const { error: joinError } = await supabase
        .from("going_now_participants")
        .upsert(
          {
            going_now_id: newId,
            user_id: user.id,
            status: "joined",
          },
          {
            onConflict: "going_now_id,user_id",
          }
        );

      if (joinError) {
        console.error("creator auto join error:", joinError);
      }

      navigate(`/going-now/${newId}`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Could not create live plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLastCreated = async () => {
    if (!lastCreatedId) {
      setErrorMsg("No created plan to delete yet.");
      return;
    }

    try {
      setDeleting(true);
      setErrorMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { error } = await supabase
        .from("going_now")
        .delete()
        .eq("id", lastCreatedId)
        .eq("user_id", user.id);

      if (error) {
        console.error("delete error:", error);
        setErrorMsg(error.message || "Could not delete plan.");
        return;
      }

      setLastCreatedId("");
      alert("Deleted.");
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Could not delete plan.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 700 }}>
      <h2>Create Going Now</h2>

      {errorMsg ? <p style={{ color: "red" }}>{errorMsg}</p> : null}

      <form onSubmit={handleCreate} style={{ display: "grid", gap: 12 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={4}
        />

        <input
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          placeholder="Location"
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="outdoor">Outdoor</option>
          <option value="chill">Chill</option>
          <option value="night">Night</option>
          <option value="sport">Sport</option>
          <option value="trip">Trip</option>
          <option value="activity">Activity</option>
        </select>

        <select value={vibe} onChange={(e) => setVibe(e.target.value)}>
          <option value="chill">Chill</option>
          <option value="social">Social</option>
          <option value="active">Active</option>
          <option value="party">Party</option>
          <option value="adventurous">Adventurous</option>
        </select>

        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="hard">Hard</option>
        </select>

        <input
          type="number"
          value={spotsTotal}
          onChange={(e) => setSpotsTotal(e.target.value)}
          placeholder="Spots total"
          min="1"
        />

        <label>
          Starts at
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </label>

        <label>
          Expires at
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create"}
        </button>
      </form>

      <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleDeleteLastCreated}
          disabled={deleting || !lastCreatedId}
        >
          {deleting ? "Deleting..." : "Delete last created"}
        </button>

        {lastCreatedId ? <p>Last created id: {lastCreatedId}</p> : null}
      </div>
    </div>
  );
}