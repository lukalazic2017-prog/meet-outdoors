import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

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

export default function CreatePackage() {
  const { hostId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
    price: "",
    currency: "EUR",
    cover_url: "",
    included: "",
    not_included: "",
    deposit_required: false,
    deposit_amount: "",
    deposit_instructions: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Package title is required.");
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

    const includedArray = form.included
      ? form.included.split(",").map((x) => x.trim()).filter(Boolean)
      : [];

    const notIncludedArray = form.not_included
      ? form.not_included.split(",").map((x) => x.trim()).filter(Boolean)
      : [];

    const { error: insertError } = await supabase.from("experience_packages").insert({
      host_id: hostId,
      title: form.title.trim(),
      slug: makeSlug(form.title),
      description: form.description || null,
      duration: form.duration || null,
      price: form.price ? Number(form.price) : null,
      currency: form.currency || "EUR",
      cover_url: form.cover_url || null,
      included: includedArray,
      not_included: notIncludedArray,
      deposit_required: form.deposit_required,
      deposit_amount: form.deposit_required && form.deposit_amount ? Number(form.deposit_amount) : 0,
      deposit_instructions: form.deposit_required ? form.deposit_instructions || null : null,
      active: true,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    navigate(`/host-dashboard/${hostId}`);
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at 50% -10%, rgba(22,245,162,.18), transparent 34%), radial-gradient(circle at 90% 10%, rgba(64,231,255,.10), transparent 30%), linear-gradient(180deg,#010302,#06130e)",
      color: "#f4fff9",
      padding: "90px 16px 120px",
      fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    },
    wrap: {
      maxWidth: 980,
      margin: "0 auto",
    },
    badge: {
      display: "inline-flex",
      padding: "8px 12px",
      borderRadius: 999,
      border: "1px solid rgba(125,255,209,.25)",
      background: "rgba(22,245,162,.08)",
      color: "#8fffe0",
      fontSize: 11,
      fontWeight: 950,
      letterSpacing: ".14em",
      textTransform: "uppercase",
      marginBottom: 16,
    },
    title: {
      margin: 0,
      fontSize: "clamp(42px, 8vw, 82px)",
      lineHeight: 0.88,
      letterSpacing: "-.08em",
      fontWeight: 950,
    },
    subtitle: {
      maxWidth: 680,
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
      background: "linear-gradient(145deg, rgba(8,24,18,.84), rgba(3,9,7,.96))",
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
    },
    blockText: {
      color: "rgba(231,255,247,.58)",
      fontSize: 13,
      lineHeight: 1.45,
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
    help: {
      color: "rgba(231,255,247,.52)",
      fontSize: 12,
      lineHeight: 1.5,
    },
    switchCard: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 14,
      padding: 15,
      borderRadius: 22,
      background: "rgba(255,255,255,.045)",
      border: "1px solid rgba(125,255,209,.13)",
      cursor: "pointer",
    },
    switchText: {
      display: "grid",
      gap: 4,
    },
    switchTitle: {
      fontWeight: 950,
      color: "#f4fff9",
    },
    switchSub: {
      color: "rgba(231,255,247,.58)",
      fontSize: 13,
      lineHeight: 1.4,
    },
    toggle: (active) => ({
      width: 58,
      height: 32,
      borderRadius: 999,
      background: active ? "linear-gradient(135deg,#16f5a2,#40e7ff)" : "rgba(255,255,255,.10)",
      border: "1px solid rgba(125,255,209,.16)",
      position: "relative",
      flex: "0 0 auto",
    }),
    knob: (active) => ({
      position: "absolute",
      top: 4,
      left: active ? 30 : 4,
      width: 22,
      height: 22,
      borderRadius: 999,
      background: active ? "#03150f" : "rgba(255,255,255,.80)",
      transition: "left .2s ease",
    }),
    warning: {
      padding: 14,
      borderRadius: 18,
      background: "rgba(244,208,111,.10)",
      border: "1px solid rgba(244,208,111,.24)",
      color: "#f7e2a2",
      fontSize: 13,
      lineHeight: 1.55,
      fontWeight: 750,
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
        <div style={styles.badge}>Experience Package</div>

        <h1 style={styles.title}>Create package.</h1>

        <p style={styles.subtitle}>
          Add a bookable package with image, price, included items and optional deposit rules.
          After this you will add available dates and free spots.
        </p>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.block}>
            <div style={styles.blockTitle}>Package basics</div>

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

            <input
              style={styles.input}
              placeholder="Cover image URL"
              value={form.cover_url}
              onChange={(e) => update("cover_url", e.target.value)}
            />
          </div>

          <div style={styles.block}>
            <div style={styles.blockTitle}>What this package includes</div>

            <input
              style={styles.input}
              placeholder="Included, separated by comma"
              value={form.included}
              onChange={(e) => update("included", e.target.value)}
            />

            <div style={styles.help}>Example: Rafting, Guide, Equipment, Lunch, Insurance</div>

            <input
              style={styles.input}
              placeholder="Not included, separated by comma"
              value={form.not_included}
              onChange={(e) => update("not_included", e.target.value)}
            />
          </div>

          <div style={styles.block}>
            <div style={styles.blockTitle}>Deposit settings</div>
            <div style={styles.blockText}>
              Hosts can choose whether users must pay a deposit before the reservation is confirmed.
            </div>

            <div
              style={styles.switchCard}
              role="button"
              tabIndex={0}
              onClick={() => update("deposit_required", !form.deposit_required)}
            >
              <div style={styles.switchText}>
                <div style={styles.switchTitle}>Require deposit for this package?</div>
                <div style={styles.switchSub}>
                  If enabled, users will see that their spot is not confirmed until the host verifies the deposit.
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
                  placeholder="Deposit instructions for this package. Example: Pay deposit to this bank account and send payment proof on WhatsApp. Reservation is confirmed only after deposit verification."
                  value={form.deposit_instructions}
                  onChange={(e) => update("deposit_instructions", e.target.value)}
                />

                <div style={styles.warning}>
                  This is not online payment yet. The host provides instructions and confirms the booking manually after deposit verification.
                </div>
              </>
            ) : null}
          </div>

          {error ? <div style={styles.error}>{error}</div> : null}

          <button type="submit" style={styles.button} disabled={saving}>
            {saving ? "Creating..." : "Create Package"}
          </button>
        </form>
      </div>
    </main>
  );
}
