import React, { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

const STORAGE_BUCKET = "experience";
const FALLBACK =
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

function splitComma(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function CreatePackage() {
  const { hostId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
    price: "",
    currency: "EUR",
    included: "",
    not_included: "",
    cover_url: "",
    gallery_urls: [],
    start_date: "",
    end_date: "",
    total_spots: "",
    deposit_required: false,
    deposit_amount: "",
    deposit_instructions: "",
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const coverPreview = form.cover_url || form.gallery_urls?.[0] || FALLBACK;

  const previewItems = useMemo(() => {
    const included = splitComma(form.included);
    return included.length ? included.slice(0, 5) : ["Guide", "Equipment", "Outdoor experience"];
  }, [form.included]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function uploadImage(file) {
    if (!file) return null;

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `hosts/${hostId}/packages/${fileName}`;

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

      const url = await uploadImage(file);
      if (url) update("cover_url", url);

      setUploading(false);
    } catch (err) {
      setUploading(false);
      setError(err.message);
    }
  }

  async function handleGalleryUpload(files) {
    try {
      const list = Array.from(files || []);
      if (!list.length) return;

      setError("");
      setUploading(true);

      const uploaded = [];

      for (const file of list) {
        const url = await uploadImage(file);
        if (url) uploaded.push(url);
      }

      setForm((prev) => ({
        ...prev,
        gallery_urls: [...(prev.gallery_urls || []), ...uploaded],
        cover_url: prev.cover_url || uploaded[0] || "",
      }));

      setUploading(false);
    } catch (err) {
      setUploading(false);
      setError(err.message);
    }
  }

  function removeGalleryImage(index) {
    setForm((prev) => ({
      ...prev,
      gallery_urls: (prev.gallery_urls || []).filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Package title is required.");
      return;
    }

    if (!form.start_date) {
      setError("Start date is required.");
      return;
    }

    if (!form.total_spots || Number(form.total_spots) <= 0) {
      setError("Total spots are required.");
      return;
    }

    if (form.end_date && new Date(form.end_date).getTime() < new Date(form.start_date).getTime()) {
      setError("End date cannot be before start date.");
      return;
    }

    if (form.deposit_required && !form.deposit_amount) {
      setError("Deposit amount is required when deposit is enabled.");
      return;
    }

    if (form.deposit_required && !form.deposit_instructions.trim()) {
      setError("Deposit instructions are required when deposit is enabled.");
      return;
    }

    setSaving(true);

    const { data: packageData, error: insertError } = await supabase
      .from("experience_packages")
      .insert({
        host_id: hostId,
        title: form.title.trim(),
        slug: makeSlug(form.title),
        description: form.description || null,
        duration: form.duration || null,
        price: form.price ? Number(form.price) : null,
        currency: form.currency || "EUR",
        cover_url: form.cover_url || form.gallery_urls[0] || null,
        gallery_urls: form.gallery_urls || [],
        included: splitComma(form.included),
        not_included: splitComma(form.not_included),
        deposit_required: !!form.deposit_required,
        deposit_amount:
          form.deposit_required && form.deposit_amount ? Number(form.deposit_amount) : 0,
        deposit_instructions: form.deposit_required ? form.deposit_instructions || null : null,
        active: true,
      })
      .select()
      .single();

    if (insertError) {
      setSaving(false);
      setError(insertError.message);
      return;
    }

    const { error: dateError } = await supabase.from("experience_dates").insert({
      package_id: packageData.id,
      start_date: form.start_date,
      end_date: form.end_date || null,
      total_spots: Number(form.total_spots),
      free_spots: Number(form.total_spots),
      closed: false,
    });

    setSaving(false);

    if (dateError) {
      setError(dateError.message);
      return;
    }

    navigate(`/host-dashboard/${hostId}`);
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at 50% -10%, rgba(22,245,162,.20), transparent 34%), radial-gradient(circle at 92% 8%, rgba(64,231,255,.13), transparent 28%), linear-gradient(180deg,#010302,#06130e)",
      color: "#f4fff9",
      padding: "90px 16px 120px",
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
      background: "rgba(22,245,162,.10)",
      border: "1px solid rgba(125,255,209,.24)",
      color: "#8fffe0",
      fontSize: 11,
      fontWeight: 950,
      letterSpacing: ".14em",
      textTransform: "uppercase",
      marginBottom: 16,
    },
    title: {
      margin: 0,
      fontSize: "clamp(46px, 8vw, 92px)",
      lineHeight: 0.86,
      letterSpacing: "-.085em",
      fontWeight: 950,
      maxWidth: 820,
    },
    subtitle: {
      maxWidth: 720,
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
      height: 240,
      overflow: "hidden",
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
      background: "linear-gradient(to top, rgba(1,3,2,.88), transparent 58%)",
    },
    previewPrice: {
      position: "absolute",
      top: 14,
      right: 14,
      padding: "8px 11px",
      borderRadius: 999,
      background: "rgba(3,15,11,.62)",
      border: "1px solid rgba(125,255,209,.16)",
      color: "#f4fff9",
      fontSize: 12,
      fontWeight: 900,
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
    form: {
      display: "grid",
      gap: 18,
    },
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
    sticky: {
      position: "sticky",
      top: 100,
      display: "grid",
      gap: 18,
    },
    blockTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: 14,
      flexWrap: "wrap",
      alignItems: "flex-start",
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
    fileBox: {
      padding: 16,
      borderRadius: 24,
      background: "rgba(255,255,255,.04)",
      border: "1px dashed rgba(125,255,209,.25)",
      color: "rgba(231,255,247,.72)",
      display: "grid",
      gap: 10,
    },
    photoPreview: {
      position: "relative",
      height: 260,
      borderRadius: 28,
      overflow: "hidden",
      border: "1px solid rgba(125,255,209,.14)",
      background: "rgba(255,255,255,.04)",
    },
    galleryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: 10,
    },
    galleryItem: {
      position: "relative",
      height: 130,
      borderRadius: 20,
      overflow: "hidden",
      border: "1px solid rgba(125,255,209,.14)",
      background: "rgba(255,255,255,.04)",
    },
    removePhoto: {
      position: "absolute",
      right: 8,
      top: 8,
      width: 30,
      height: 30,
      borderRadius: 999,
      border: "none",
      background: "rgba(0,0,0,.65)",
      color: "#fff",
      fontWeight: 950,
      cursor: "pointer",
    },
    switchCard: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 14,
      padding: 15,
      borderRadius: 24,
      background: "rgba(255,255,255,.045)",
      border: "1px solid rgba(125,255,209,.13)",
      cursor: "pointer",
    },
    toggle: (active) => ({
      width: 60,
      height: 34,
      borderRadius: 999,
      background: active
        ? "linear-gradient(135deg,#16f5a2,#40e7ff)"
        : "rgba(255,255,255,.10)",
      border: "1px solid rgba(125,255,209,.16)",
      position: "relative",
      flex: "0 0 auto",
    }),
    knob: (active) => ({
      position: "absolute",
      top: 4,
      left: active ? 30 : 4,
      width: 24,
      height: 24,
      borderRadius: 999,
      background: active ? "#03150f" : "rgba(255,255,255,.82)",
      transition: "left .2s ease",
    }),
    warning: {
      padding: 14,
      borderRadius: 20,
      background: "rgba(244,208,111,.10)",
      border: "1px solid rgba(244,208,111,.24)",
      color: "#f7e2a2",
      fontSize: 13,
      lineHeight: 1.55,
      fontWeight: 750,
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
        .mo-create-package-hero-inner,
        .mo-create-package-shell {
          grid-template-columns: 1fr !important;
        }

        .mo-create-package-sticky {
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

          <div className="mo-create-package-hero-inner" style={styles.heroInner}>
            <div>
              <div style={styles.badge}>Experience Package</div>

              <h1 style={styles.title}>
                Create bookable
                <br />
                package.
              </h1>

              <p style={styles.subtitle}>
                Add photos, price, deposit rules, first date and available spots in one premium booking flow.
              </p>
            </div>

            <div style={styles.previewCard}>
              <div style={styles.previewMedia}>
                <img src={coverPreview} alt="Package preview" style={styles.previewImg} />
                <div style={styles.previewOverlay} />
                <div style={styles.previewBadge}>{form.duration || "Experience"}</div>
                <div style={styles.previewPrice}>
                  {form.price ? `${form.price} ${form.currency || "EUR"}` : "Price soon"}
                </div>
              </div>

              <div style={styles.previewBody}>
                <div style={styles.previewTitle}>{form.title || "Your package title"}</div>
                <div style={styles.previewText}>
                  {form.description ||
                    "This live preview helps you see how your package will feel on the public host page."}
                </div>

                <div style={styles.chipRow}>
                  {previewItems.map((item) => (
                    <span key={item} style={styles.chip}>
                      ✓ {item}
                    </span>
                  ))}
                </div>

                <div style={styles.chipRow}>
                  <span style={styles.chip}>
                    {form.start_date || "Start date"} {form.end_date ? `→ ${form.end_date}` : ""}
                  </span>
                  <span style={styles.chip}>{form.total_spots || 0} spots</span>
                  <span style={styles.chip}>
                    {form.deposit_required ? `Deposit ${form.deposit_amount || 0}` : "No deposit"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div className="mo-create-package-shell" style={styles.formShell}>
            <div className="mo-create-package-sticky" style={styles.sticky}>
              <section style={styles.block}>
                <div style={styles.blockTitle}>Package basics</div>
                <div style={styles.blockText}>
                  Name, story, price and duration. Keep it clear because this sells the experience.
                </div>

                <input
                  style={styles.input}
                  placeholder="Package title *"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                />

                <textarea
                  style={styles.textarea}
                  placeholder="Package description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                />

                <div style={styles.grid}>
                  <input
                    style={styles.input}
                    placeholder="Duration, e.g. 2 days"
                    value={form.duration}
                    onChange={(e) => update("duration", e.target.value)}
                  />

                  <input
                    style={styles.input}
                    placeholder="Full price"
                    type="number"
                    value={form.price}
                    onChange={(e) => update("price", e.target.value)}
                  />

                  <input
                    style={styles.input}
                    placeholder="Currency"
                    value={form.currency}
                    onChange={(e) => update("currency", e.target.value)}
                  />
                </div>
              </section>

              <section style={styles.block}>
                <div style={styles.blockTitle}>First available date</div>
                <div style={styles.blockText}>
                  This creates the first bookable date immediately. More dates can be added later.
                </div>

                <div style={styles.grid}>
                  <input
                    style={styles.input}
                    type="date"
                    value={form.start_date}
                    onChange={(e) => update("start_date", e.target.value)}
                  />

                  <input
                    style={styles.input}
                    type="date"
                    value={form.end_date}
                    onChange={(e) => update("end_date", e.target.value)}
                  />

                  <input
                    style={styles.input}
                    placeholder="Total spots *"
                    type="number"
                    value={form.total_spots}
                    onChange={(e) => update("total_spots", e.target.value)}
                  />
                </div>
              </section>
            </div>

            <div style={styles.form}>
              <section style={styles.block}>
                <div style={styles.blockTop}>
                  <div>
                    <div style={styles.blockTitle}>Photos from gallery</div>
                    <div style={styles.blockText}>
                      Upload real photos. Cover image appears first, gallery appears on the public page.
                    </div>
                  </div>
                </div>

                {form.cover_url ? (
                  <div style={styles.photoPreview}>
                    <img src={form.cover_url} alt="Cover preview" style={styles.previewImg} />
                  </div>
                ) : null}

                <div style={styles.fileBox}>
                  <strong>Cover image</strong>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCoverUpload(e.target.files?.[0])}
                  />
                  <span>{uploading ? "Uploading..." : "Upload main package photo from gallery."}</span>
                </div>

                <div style={styles.fileBox}>
                  <strong>Gallery photos</strong>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleGalleryUpload(e.target.files)}
                  />
                  <span>{uploading ? "Uploading..." : "Upload multiple photos for this package."}</span>
                </div>

                {form.gallery_urls.length ? (
                  <div style={styles.galleryGrid}>
                    {form.gallery_urls.map((img, index) => (
                      <div key={`${img}-${index}`} style={styles.galleryItem}>
                        <img src={img} alt="" style={styles.previewImg} />
                        <button
                          type="button"
                          style={styles.removePhoto}
                          onClick={() => removeGalleryImage(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              <section style={styles.block}>
                <div style={styles.blockTitle}>Included items</div>

                <input
                  style={styles.input}
                  placeholder="Included, separated by comma"
                  value={form.included}
                  onChange={(e) => update("included", e.target.value)}
                />

                <input
                  style={styles.input}
                  placeholder="Not included, separated by comma"
                  value={form.not_included}
                  onChange={(e) => update("not_included", e.target.value)}
                />
              </section>

              <section style={styles.block}>
                <div style={styles.blockTitle}>Deposit settings</div>

                <div
                  style={styles.switchCard}
                  role="button"
                  tabIndex={0}
                  onClick={() => update("deposit_required", !form.deposit_required)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      update("deposit_required", !form.deposit_required);
                    }
                  }}
                >
                  <div>
                    <strong>Require deposit?</strong>
                    <div style={styles.blockText}>
                      Reservation will wait until host manually verifies deposit.
                    </div>
                  </div>

                  <div style={styles.toggle(form.deposit_required)}>
                    <div style={styles.knob(form.deposit_required)} />
                  </div>
                </div>

                {form.deposit_required ? (
                  <>
                    <div style={styles.grid}>
                      <input
                        style={styles.input}
                        placeholder="Deposit amount"
                        type="number"
                        value={form.deposit_amount}
                        onChange={(e) => update("deposit_amount", e.target.value)}
                      />

                      <input
                        style={styles.input}
                        placeholder="Currency"
                        value={form.currency}
                        onChange={(e) => update("currency", e.target.value)}
                      />
                    </div>

                    <textarea
                      style={styles.textarea}
                      placeholder="Deposit instructions. Example: Pay deposit to this bank account and send proof on WhatsApp."
                      value={form.deposit_instructions}
                      onChange={(e) => update("deposit_instructions", e.target.value)}
                    />

                    <div style={styles.warning}>
                      No online payment is processed yet. This is manual deposit confirmation.
                    </div>
                  </>
                ) : null}
              </section>

              {error ? <div style={styles.error}>{error}</div> : null}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="submit" style={styles.button} disabled={saving || uploading}>
                  {saving ? "Creating..." : uploading ? "Uploading..." : "Create package & date"}
                </button>

                <button
                  type="button"
                  style={styles.ghostButton}
                  onClick={() => navigate(`/host-dashboard/${hostId}`)}
                >
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
