import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

function toLocalInputValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EditGoingNow() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [userId, setUserId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [category, setCategory] = useState("chill");
  const [vibe, setVibe] = useState("social");
  const [difficulty, setDifficulty] = useState("easy");
  const [spotsTotal, setSpotsTotal] = useState(6);
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      setLoading(true);
      setErrorMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        navigate("/login");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("going_now")
        .select("*")
        .eq("id", id)
        .single();

      if (!mounted) return;

      if (error) {
        console.error("load edit item error:", error);
        setErrorMsg(error.message || "Could not load live plan.");
        setLoading(false);
        return;
      }

      if (!data) {
        setErrorMsg("Live plan not found.");
        setLoading(false);
        return;
      }

      if (data.user_id !== user.id) {
        setErrorMsg("You can only edit your own live plan.");
        setLoading(false);
        return;
      }

      setTitle(data.title || "");
      setDescription(data.description || "");
      setLocationText(data.location_text || "");
      setCategory(data.category || "chill");
      setVibe(data.vibe || "social");
      setDifficulty(data.difficulty || "easy");
      setSpotsTotal(data.spots_total || 6);
      setStartsAt(toLocalInputValue(data.starts_at));
      setExpiresAt(toLocalInputValue(data.expires_at));
      setStatus(data.status || "active");

      setLoading(false);
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg("Title is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        location_text: locationText.trim() || null,
        category: category || null,
        vibe: vibe || null,
        difficulty: difficulty || null,
        spots_total: spotsTotal ? Number(spotsTotal) : null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        status: status || "active",
      };

      const { error } = await supabase
        .from("going_now")
        .update(payload)
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("update error:", error);
        setErrorMsg(error.message || "Could not save changes.");
        return;
      }

      navigate(`/going-now/${id}`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setErrorMsg("");

      const { error } = await supabase
        .from("going_now")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("delete error:", error);
        setErrorMsg(error.message || "Could not delete live plan.");
        return;
      }

      navigate("/going-now");
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Could not delete live plan.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 20, maxWidth: 700 }}>
      <h2>Edit Going Now</h2>

      {errorMsg ? <p style={{ color: "red" }}>{errorMsg}</p> : null}

      <form onSubmit={handleSave} style={{ display: "grid", gap: 12 }}>
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
          min="1"
          value={spotsTotal}
          onChange={(e) => setSpotsTotal(e.target.value)}
          placeholder="Spots total"
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

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">active</option>
          <option value="ended">ended</option>
          <option value="cancelled">cancelled</option>
          <option value="full">full</option>
        </select>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/going-now/${id}`)}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </form>
    </div>
  );
}