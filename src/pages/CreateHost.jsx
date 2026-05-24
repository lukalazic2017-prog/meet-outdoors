import React, { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const STORAGE_BUCKET = "experience";
const FALLBACK_COVER =
  "https://images.pexels.com/photos/1732278/pexels-photo-1732278.jpeg";

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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const slug = useMemo(() => makeSlug(form.name), [form.name]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function uploadImage(file, folder) {
    if (!file) return null;

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const safeFolder = folder || "hosts";
    const path = `host-profiles/${safeFolder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleCoverUpload(file) {
    try {
      if (!file) return;
      setError("");
      setUploading(true);

      const url = await uploadImage(file, "covers");
      if (url) update("cover_url", url);

      setUploading(false);
    } catch (err) {
      setUploading(false);
      setError(err.message);
    }
  }

  async function handleLogoUpload(file) {
    try {
      if (!file) return;
      setError("");
      setUploading(true);

      const url = await uploadImage(file, "logos");
      if (url) update("logo_url", url);

      setUploading(false);
    } catch (err) {
      setUploading(false);
      setError(err.message);
    }
  }

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
        "radial-gradient(circle at 50% -10%, rgba(22,245,162,.20), transparent 34%), radial-gradient(circle at 90% 10%, rgba(64,231,255,.12), transparent 30%), linear-gradient(180deg,#010302,#06130e)",
      color: "#f4fff9",
      padding: "92px 16px 120px",
      fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    },
    wrap: { maxWidth: 1280, margin: "0 auto" },
    hero: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 42,
      padding: 22,
      marginBottom: 18,
      border: "1px solid rgba(125,255,209,.20)",
      background:
        "radial-gradient(circle at 90% 0%, rgba(22,245,162,.18), transparent 32%), linear-gradient(145deg, rgba(8,24,18,.86), rgba(3,9,7,.97))",
      boxShadow: "0 34px 100px rgba(0,0,0,.34)",
    },
    heroGrid: {
      position: "absolute",
      inset: 0,
      opacity: 0.22,
      background:
        "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
      backgroundSize: "42px 42px",
    },
    heroInner: {
      position: "relative",
      zIndex: 2,
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 420px)",
      gap: 18,
      alignItems: "stretch",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
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
      fontSize: "clamp(44px, 8vw, 90px)",
      lineHeight: 0.86,
      letterSpacing: "-.085em",
      fontWeight: 950,
      maxWidth: 800,
    },
    subtitle: {
      maxWidth: 760,
      color: "rgba(231,255,247,.76)",
      fontSize: 16,
      lineHeight: 1.65,
      marginTop: 18,
      marginBottom: 0,
    },
    previewCard: {
      overflow: "hidden",
      minHeight: 420,
      borderRadius: 34,
      border: "1px solid rgba(125,255,209,.18)",
      background: "rgba(255,255,255,.045)",
      boxShadow: "0 24px 70px rgba(0,0,0,.26)",
    },
    previewMedia: {
      position: "relative",
      height: 245,
      overflow: "hidden",
      background: "rgba(255,255,255,.04)",
    },
    previewImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
      filter: "saturate(1.08) contrast(1.05)",
    },
    previewOverlay: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(to top, rgba(1,3,2,.92), transparent 58%)",
    },
    logoPreview: {
      position: "absolute",
      left: 16,
      bottom: 16,
      width: 76,
      height: 76,
      borderRadius: 24,
      objectFit: "cover",
      background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
      border: "1px solid rgba(255,255,255,.20)",
      boxShadow: "0 20px 46px rgba(0,0,0,.34)",
    },
    previewBadge: {
      position: "absolute",
      top: 14,
      left: 14,
      padding: "8px 11px",
      borderRadius: 999,
      background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
      color: "#03150f",
      fontSize: 11,
      fontWeight: 950,
      textTransform: "uppercase",
      letterSpacing: ".08em",
    },
    previewBody: { padding: 16 },
    previewTitle: {
      fontSize: 30,
      lineHeight: 0.96,
      letterSpacing: "-.06em",
      fontWeight: 950,
      marginBottom: 8,
    },
    previewText: {
      color: "rgba(231,255,247,.68)",
      fontSize: 13,
      lineHeight: 1.55,
    },
    chipRow: { display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 },
    chip: {
      padding: "7px 10px",
      borderRadius: 999,
      background: "rgba(255,255,255,.045)",
      border: "1px solid rgba(125,255,209,.12)",
      color: "rgba(231,255,247,.82)",
      fontSize: 12,
      fontWeight: 800,
    },
    formShell: {
      display: "grid",
      gridTemplateColumns: "minmax(0, .92fr) minmax(0, 1.08fr)",
      gap: 18,
      alignItems: "start",
    },
    sticky: {
      position: "sticky",
      top: 100,
      display: "grid",
      gap: 18,
    },
    form: { display: "grid", gap: 18 },
    block: {
      padding: 18,
      borderRadius: 34,
      background:
        "linear-gradient(145deg, rgba(8,24,18,.84), rgba(3,9,7,.96))",
      border: "1px solid rgba(125,255,209,.18)",
      boxShadow: "0 30px 90px rgba(0,0,0,.24)",
      display: "grid",
      gap: 14,
    },
    blockTitle: {
      fontSize: 13,
      color: "#8fffe0",
      fontWeight: 950,
      letterSpacing: ".14em",
      textTransform: "uppercase",
    },
    blockText: {
      color: "rgba(231,255,247,.58)",
      fontSize: 13,
      lineHeight: 1.5,
      maxWidth: 640,
      marginTop: 6,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
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
      overflowWrap: "anywhere",
    },
    photoPreview: {
      position: "relative",
      height: 260,
      borderRadius: 28,
      overflow: "hidden",
      border: "1px solid rgba(125,255,209,.14)",
      background: "rgba(255,255,255,.04)",
    },
    logoBox: {
      width: 130,
      height: 130,
      borderRadius: 32,
      overflow: "hidden",
      border: "1px solid rgba(125,255,209,.18)",
      background: "rgba(255,255,255,.04)",
      display: "grid",
      placeItems: "center",
    },
    fileBox: {
      padding: 16,
      borderRadius: 24,
      background: "rgba(255,255,255,.04)",
      border: "1px dashed rgba(125,255,209,.25)",
      color: "rgba(231,255,247,.72)",
      display: "grid",
      gap: 10,
    },
    error: {
      padding: 14,
      borderRadius: 20,
      background: "rgba(255,80,80,.12)",
      border: "1px solid rgba(255,80,80,.25)",
      color: "#ffd6d6",
      fontSize: 13,
      fontWeight: 850,
    },
    button: {
      border: "none",
      borderRadius: 999,
      padding: "18px 22px",
      background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
      color: "#03150f",
      fontWeight: 950,
      fontSize: 15,
      cursor: "pointer",
      boxShadow: "0 24px 56px rgba(22,245,162,.20)",
    },
    ghostButton: {
      border: "1px solid rgba(125,255,209,.18)",
      borderRadius: 999,
      padding: "13px 16px",
      background: "rgba(255,255,255,.04)",
      color: "#f4fff9",
      fontWeight: 900,
      cursor: "pointer",
    },
    mobileCss: `
      @media (max-width: 960px) {
        .mo-create-host-hero-inner,
        .mo-create-host-shell {
          grid-template-columns: 1fr !important;
        }

        .mo-create-host-sticky {
          position: static !important;
        }
      }
    `,
  };

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <section style={styles.hero}>
          <div style={styles.heroGrid} />

          <div className="mo-create-host-hero-inner" style={styles.heroInner}>
            <div>
              <div style={styles.badge}>Experience Host</div>

              <h1 style={styles.title}>
                Create your
                <br />
                booking profile.
              </h1>

              <p style={styles.subtitle}>
                Build a serious outdoor host page with contact details, location, map,
                photos and payment instructions before guests reserve.
              </p>
            </div>

            <div style={styles.previewCard}>
              <div style={styles.previewMedia}>
                <img
                  src={form.cover_url || FALLBACK_COVER}
                  alt="Host cover preview"
                  style={styles.previewImg}
                />
                <div style={styles.previewOverlay} />
                <div style={styles.previewBadge}>{form.category || "Outdoor host"}</div>

                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo preview" style={styles.logoPreview} />
                ) : (
                  <div style={styles.logoPreview} />
                )}
              </div>

              <div style={styles.previewBody}>
                <div style={styles.previewTitle}>{form.name || "Your host name"}</div>

                <div style={styles.previewText}>
                  {form.short_description ||
                    "This live preview shows how your public booking profile will feel to guests."}
                </div>

                <div style={styles.chipRow}>
                  <span style={styles.chip}>📍 {form.location || form.city || "Location"}</span>
                  <span style={styles.chip}>✉ {form.email || "Email"}</span>
                  <span style={styles.chip}>◎ {form.instagram || "Instagram"}</span>
                </div>

                <div style={styles.chipRow}>
                  <span style={styles.chip}>/host/{slug || "your-host-name"}</span>
                  <span style={styles.chip}>Pending verification</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div className="mo-create-host-shell" style={styles.formShell}>
            <div className="mo-create-host-sticky" style={styles.sticky}>
              <section style={styles.block}>
                <div>
                  <div style={styles.blockTitle}>Business identity</div>
                  <div style={styles.blockText}>
                    This is what users see first on your public booking page.
                  </div>
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
              </section>

              <section style={styles.block}>
                <div>
                  <div style={styles.blockTitle}>Deposit / payment instructions</div>
                  <div style={styles.blockText}>
                    Shown when users reserve packages that require deposit.
                  </div>
                </div>

                <textarea
                  style={styles.textarea}
                  placeholder="Example: To confirm your reservation, pay the deposit and send proof to our WhatsApp. Your spot is confirmed only after we verify the deposit. *"
                  value={form.payment_instructions}
                  onChange={(e) => update("payment_instructions", e.target.value)}
                />
              </section>
            </div>

            <div style={styles.form}>
              <section style={styles.block}>
                <div>
                  <div style={styles.blockTitle}>Images from gallery</div>
                  <div style={styles.blockText}>
                    Upload real cover and logo images. No URL needed.
                  </div>
                </div>

                {form.cover_url ? (
                  <div style={styles.photoPreview}>
                    <img src={form.cover_url} alt="Cover" style={styles.previewImg} />
                  </div>
                ) : null}

                <div style={styles.fileBox}>
                  <strong>Cover image</strong>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCoverUpload(e.target.files?.[0])}
                  />
                  <span>{uploading ? "Uploading..." : "Upload cover photo from gallery."}</span>
                </div>

                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={styles.logoBox}>
                    {form.logo_url ? (
                      <img src={form.logo_url} alt="Logo" style={styles.previewImg} />
                    ) : (
                      <span style={{ color: "rgba(231,255,247,.55)", fontWeight: 900 }}>
                        Logo
                      </span>
                    )}
                  </div>

                  <div style={{ ...styles.fileBox, flex: 1, minWidth: 240 }}>
                    <strong>Logo image</strong>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                    />
                    <span>{uploading ? "Uploading..." : "Upload logo from gallery."}</span>
                  </div>
                </div>
              </section>

              <section style={styles.block}>
                <div>
                  <div style={styles.blockTitle}>Location & map</div>
                  <div style={styles.blockText}>
                    Address and map link are required so users know exactly where the host is.
                  </div>
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
              </section>

              <section style={styles.block}>
                <div>
                  <div style={styles.blockTitle}>Contact information</div>
                  <div style={styles.blockText}>
                    Phone, email and Instagram are required so users can verify details.
                  </div>
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
              </section>

              {error ? <div style={styles.error}>{error}</div> : null}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="submit" style={styles.button} disabled={saving || uploading}>
                  {saving ? "Creating..." : uploading ? "Uploading..." : "Create Experience Host"}
                </button>

                <button type="button" style={styles.ghostButton} onClick={() => navigate("/")}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style>{styles.mobileCss}</style>
    </main>
  );
}
