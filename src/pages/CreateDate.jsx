import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

export default function CreateDate() {
  const { packageId, hostId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    total_spots: "",
    price_override: "",
    closed: false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!form.start_date) {
      setError("Start date required");
      return;
    }

    if (!form.total_spots) {
      setError("Spots required");
      return;
    }

    setSaving(true);

    const totalSpots =
      Number(form.total_spots);

    const { error: insertError } =
      await supabase
        .from("experience_dates")
        .insert({

          package_id: packageId,

          start_date:
            form.start_date,

          end_date:
            form.end_date || null,

          total_spots:
            totalSpots,

          free_spots:
            totalSpots,

          price_override:
            form.price_override
              ? Number(
                  form.price_override
                )
              : null,

          closed:
            form.closed,
        });

    setSaving(false);

    if (insertError) {
      setError(
        insertError.message
      );
      return;
    }

    navigate(
      `/host-dashboard/${hostId}`
    );
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "linear-gradient(180deg,#010302,#06130e)",
      color: "#f4fff9",
      padding:
        "90px 16px 120px",
      fontFamily:
        "Inter,sans-serif",
    },

    wrap: {
      maxWidth: 850,
      margin: "0 auto",
    },

    card: {
      padding: 24,

      borderRadius: 34,

      background:
        "linear-gradient(145deg, rgba(8,24,18,.82), rgba(3,9,7,.94))",

      border:
        "1px solid rgba(125,255,209,.18)",
    },

    badge: {
      display: "inline-flex",

      padding:
        "8px 12px",

      borderRadius: 999,

      color: "#8fffe0",

      border:
        "1px solid rgba(125,255,209,.22)",

      fontSize: 11,

      fontWeight: 900,

      letterSpacing:
        ".12em",

      textTransform:
        "uppercase",

      marginBottom: 18,
    },

    title: {
      margin: 0,

      fontSize:
        "clamp(40px,8vw,74px)",

      lineHeight: .9,

      fontWeight: 950,

      letterSpacing:
        "-.08em",
    },

    subtitle: {
      marginTop: 14,

      marginBottom: 26,

      color:
        "rgba(231,255,247,.72)",

      lineHeight: 1.6,
    },

    form: {
      display: "grid",

      gap: 14,
    },

    grid: {
      display: "grid",

      gridTemplateColumns:
        "repeat(auto-fit,minmax(220px,1fr))",

      gap: 12,
    },

    input: {
      width: "100%",

      boxSizing:
        "border-box",

      border:
        "1px solid rgba(125,255,209,.14)",

      background:
        "rgba(255,255,255,.05)",

      color:
        "#f4fff9",

      borderRadius: 18,

      padding:
        "15px 14px",

      outline: "none",
    },

    row: {
      display: "flex",

      gap: 10,

      alignItems:
        "center",
    },

    button: {
      border: "none",

      borderRadius: 999,

      padding:
        "16px 20px",

      background:
        "linear-gradient(135deg,#16f5a2,#40e7ff)",

      color:
        "#03150f",

      fontWeight: 950,

      cursor: "pointer",
    },

    error: {
      padding: 14,

      borderRadius: 16,

      background:
        "rgba(255,80,80,.12)",

      border:
        "1px solid rgba(255,80,80,.24)",
    },
  };

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>

        <div style={styles.card}>

          <div style={styles.badge}>
            Experience Date
          </div>

          <h1 style={styles.title}>
            Add date.
          </h1>

          <p style={styles.subtitle}>
            Add available
            experience dates,
            capacity and
            booking limits.
          </p>

          <form
            style={styles.form}
            onSubmit={
              handleSubmit
            }
          >

            <div
              style={styles.grid}
            >

              <input
                type="date"

                style={
                  styles.input
                }

                value={
                  form.start_date
                }

                onChange={e=>
                  update(
                    "start_date",
                    e.target.value
                  )
                }
              />

              <input
                type="date"

                style={
                  styles.input
                }

                value={
                  form.end_date
                }

                onChange={e=>
                  update(
                    "end_date",
                    e.target.value
                  )
                }
              />

            </div>

            <div
              style={styles.grid}
            >

              <input
                type="number"

                placeholder=
                "Total spots"

                style={
                  styles.input
                }

                value={
                  form.total_spots
                }

                onChange={e=>
                  update(
                    "total_spots",
                    e.target.value
                  )
                }
              />

              <input
                type="number"

                placeholder=
                "Price override"

                style={
                  styles.input
                }

                value={
                  form.price_override
                }

                onChange={e=>
                  update(
                    "price_override",
                    e.target.value
                  )
                }
              />

            </div>

            <label
              style={
                styles.row
              }
            >

              <input
                type="checkbox"

                checked={
                  form.closed
                }

                onChange={e=>
                  update(
                    "closed",
                    e.target.checked
                  )
                }
              />

              Closed
              reservations

            </label>

            {error ? (
              <div
                style={
                  styles.error
                }
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"

              style={
                styles.button
              }
            >

              {saving
                ? "Saving..."
                : "Create date"}

            </button>

          </form>

        </div>

      </div>
    </main>
  );
}