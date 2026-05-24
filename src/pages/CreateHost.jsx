import React, { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/č|ć/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CreateHost() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "",
    location: "",
    country: "",
    city: "",
    address: "",
    map_url: "",
    short_description: "",
    description: "",
    cover_url: "",
    logo_url: "",
    instagram: "",
    website: "",
    whatsapp: "",
    phone: "",
    email: "",
    payment_instructions: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const slug = useMemo(() => makeSlug(form.name), [form.name]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Host name is required.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Phone is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!form.instagram.trim()) {
      setError("Instagram is required.");
      return;
    }

    if (!form.address.trim()) {
      setError("Address is required.");
      return;
    }

    if (!form.map_url.trim()) {
      setError("Google Maps link is required.");
      return;
    }

    if (!form.payment_instructions.trim()) {
      setError("Payment / deposit instructions are required.");
      return;
    }

    setSaving(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      setSaving(false);
      setError("You must be logged in.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("experience_hosts")
      .insert({
        owner_id: userData.user.id,
        name: form.name.trim(),
        slug,
        category: form.category || null,
        location: form.location || null,
        country: form.country || null,
        city: form.city || null,
        address: form.address || null,
        map_url: form.map_url || null,
        short_description: form.short_description || null,
        description: form.description || null,
        cover_url: form.cover_url || null,
        logo_url: form.logo_url || null,
        instagram: form.instagram || null,
        website: form.website || null,
        whatsapp: form.whatsapp || null,
        phone: form.phone || null,
        email: form.email || null,
        payment_instructions: form.payment_instructions || null,
        verified: false,
        active: true,
      })
      .select()
      .single();

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    navigate(`/host-dashboard/${data.id}`);
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at 50% -10%, rgba(22,245,162,.18), transparent 34%), radial-gradient(circle at 90% 10%, rgba(64,231,255,.10), transparent 30%), linear-gradient(180deg,#010302,#06130e)",
      color: "#f4fff9",
      padding: "92px 16px 120px",
      fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    },
    wrap: {
      maxWidth: 1080,
      margin: "0 auto",
    },
    badge: {
      display: "inline-flex",
      padding: "8px 12px",
      borderRadius: 999,
      border: "1px solid rgba(125,255,209,.25)",
      color: "#8fffe0",
      background: "rgba(22,245,162,.08)",
      fontSize: 11,
      fontWeight: 950,
      letterSpacing: ".14em",
      textTransform: "uppercase",
      marginBottom: 16,
    },
    title: {
      margin: 0,
      fontSize: "clamp(42px, 8vw, 84px)",
      lineHeight: 0.88,
      letterSpacing: "-.08em",
      fontWeight: 950,
      maxWidth: 760,
    },
    subtitle: {
      maxWidth: 720,
      color: "rgba(231,255,247,.76)",
      fontSize: 16,
      lineHeight: 1.65,
      marginTop: 18,
      marginBottom: 28,
    },
    form: {
      display: "grid",
      gap: 18,
      padding: 18,
      borderRadius: 36,
      background:
        "linear-gradient(145deg, rgba(8,24,18,.84), rgba(3,9,7,.96))",
      border: "1px solid rgba(125,255,209,.22)",
      boxShadow: "0 34px 90px rgba(0,0,0,.34)",
    },
    block: {
      padding: 16,
      borderRadius: 28,
      background: "rgba(255,255,255,.035)",
      border: "1px solid rgba(125,255,209,.10)",
      display: "grid",
      gap: 12,
    },
    blockTitle: {
      fontSize: 12,
      color: "#8fffe0",
      fontWeight: 950,
      letterSpacing: ".14em",
      textTransform: "uppercase",
      marginBottom: 2,
    },
    blockText: {
      color: "rgba(231,255,247,.58)",
      fontSize: 13,
      lineHeight: 1.45,
      marginBottom: 4,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: 12,
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      border: "1px solid rgba(125,255,209,.14)",
      background: "rgba(255,255,255,.045)",
      color: "#f4fff9",
      borderRadius: 18,
      padding: "15px 14px",
      outline: "none",
      fontSize: 14,
    },
    textarea: {
      width: "100%",
      boxSizing: "border-box",
      minHeight: 130,
      resize: "vertical",
      border: "1px solid rgba(125,255,209,.14)",
      background: "rgba(255,255,255,.045)",
      color: "#f4fff9",
      borderRadius: 18,
      padding: "15px 14px",
      outline: "none",
      fontSize: 14,
      fontFamily: "inherit",
    },
    slug: {
      padding: "13px 14px",
      borderRadius: 18,
      background: "rgba(22,245,162,.08)",
      border: "1px solid rgba(125,255,209,.16)",
      color: "rgba(231,255,247,.76)",
      fontSize: 13,
      fontWeight: 800,
    },
    error: {
      padding: 14,
      borderRadius: 18,
      background: "rgba(255,80,80,.12)",
      border: "1px solid rgba(255,80,80,.25)",
      color: "#ffd6d6",
      fontSize: 13,
      fontWeight: 800,
    },
    button: {
      border: "none",
      borderRadius: 999,
      padding: "17px 20px",
      background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
      color: "#03150f",
      fontWeight: 950,
      fontSize: 15,
      cursor: "pointer",
      boxShadow: "0 22px 52px rgba(22,245,162,.20)",
    },
  };

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.badge}>Experience Host</div>

        <h1 style={styles.title}>
          Create your
          <br />
          booking profile.
        </h1>

        <p style={styles.subtitle}>
          Build a verified outdoor booking profile with contact details, location,
          payment instructions and everything guests need before they reserve.
        </p>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.block}>
            <div style={styles.blockTitle}>Business identity</div>
            <div style={styles.blockText}>
              This is what users see on your public booking page.
            </div>

            <div style={styles.grid}>
              <input
                style={styles.input}
                placeholder="Host name *"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="Category, e.g. Rafting"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
              />
            </div>

            <div style={styles.slug}>Public URL: /host/{slug || "your-host-name"}</div>

            <input
              style={styles.input}
              placeholder="Short description"
              value={form.short_description}
              onChange={(e) => update("short_description", e.target.value)}
            />

            <textarea
              style={styles.textarea}
              placeholder="Full description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div style={styles.block}>
            <div style={styles.blockTitle}>Location & map</div>
            <div style={styles.blockText}>
              Address and map link are important because users need to know exactly where the host is located.
            </div>

            <div style={styles.grid}>
              <input
                style={styles.input}
                placeholder="Location, e.g. Tara River"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="City"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="Country"
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="Full address *"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </div>

            <input
              style={styles.input}
              placeholder="Google Maps link *"
              value={form.map_url}
              onChange={(e) => update("map_url", e.target.value)}
            />
          </div>

          <div style={styles.block}>
            <div style={styles.blockTitle}>Images</div>

            <div style={styles.grid}>
              <input
                style={styles.input}
                placeholder="Cover image URL"
                value={form.cover_url}
                onChange={(e) => update("cover_url", e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="Logo URL"
                value={form.logo_url}
                onChange={(e) => update("logo_url", e.target.value)}
              />
            </div>
          </div>

          <div style={styles.block}>
            <div style={styles.blockTitle}>Contact information</div>
            <div style={styles.blockText}>
              Phone, email and Instagram are required so users can verify details and hosts can confirm reservations.
            </div>

            <div style={styles.grid}>
              <input
                style={styles.input}
                placeholder="Phone *"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="Email *"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="Instagram *"
                value={form.instagram}
                onChange={(e) => update("instagram", e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="WhatsApp"
                value={form.whatsapp}
                onChange={(e) => update("whatsapp", e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="Website"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
              />
            </div>
          </div>

          <div style={styles.block}>
            <div style={styles.blockTitle}>Deposit / payment instructions</div>
            <div style={styles.blockText}>
              This text is shown when a user reserves a package that requires a deposit.
            </div>

            <textarea
              style={styles.textarea}
              placeholder="Example: To confirm your reservation, pay the deposit and send proof to our WhatsApp. Your spot is confirmed only after we verify the deposit. *"
              value={form.payment_instructions}
              onChange={(e) => update("payment_instructions", e.target.value)}
            />
          </div>

          {error ? <div style={styles.error}>{error}</div> : null}

          <button type="submit" style={styles.button} disabled={saving}>
            {saving ? "Creating..." : "Create Experience Host"}
          </button>
        </form>
      </div>
    </main>
  );
}
