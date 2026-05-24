import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useParams } from "react-router-dom";

export default function HostBookings() {
  const { hostId } = useParams();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("experience_bookings")
      .select(`
        *,
        experience_packages(
          title
        ),
        experience_dates(
          start_date,
          end_date,
          total_spots,
          free_spots
        )
      `)
      .eq("host_id", hostId)
      .order("created_at", { ascending: false });

    if (!error) {
      setBookings(data || []);
    }

    setLoading(false);
  }, [hostId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from("experience_bookings")
      .update({ status })
      .eq("id", id);

    if (!error) {
      await loadBookings();
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(180deg,#010302,#06130e)",
      color: "#f4fff9",
      padding: "90px 16px 120px",
      fontFamily: "Inter,sans-serif",
    },

    wrap: {
      maxWidth: 1100,
      margin: "0 auto",
    },

    badge: {
      display: "inline-flex",
      padding: "8px 12px",
      borderRadius: 999,
      border: "1px solid rgba(125,255,209,.22)",
      color: "#8fffe0",
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: ".12em",
      textTransform: "uppercase",
      marginBottom: 18,
    },

    title: {
      fontSize: "clamp(42px,8vw,78px)",
      lineHeight: .9,
      fontWeight: 950,
      letterSpacing: "-.08em",
      margin: 0,
      marginBottom: 28,
    },

    list: {
      display: "grid",
      gap: 14,
    },

    card: {
      padding: 18,
      borderRadius: 26,
      background: "rgba(255,255,255,.045)",
      border: "1px solid rgba(125,255,209,.13)",
    },

    top: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },

    name: {
      fontSize: 22,
      fontWeight: 950,
    },

    status: {
      padding: "7px 11px",
      borderRadius: 999,
      background: "rgba(22,245,162,.12)",
      color: "#8fffe0",
      fontSize: 12,
      fontWeight: 900,
      textTransform: "uppercase",
    },

    meta: {
      marginTop: 10,
      display: "grid",
      gap: 6,
      color: "rgba(231,255,247,.72)",
      fontSize: 14,
    },

    actions: {
      marginTop: 16,
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    },

    btn: {
      border: "none",
      borderRadius: 999,
      padding: "12px 15px",
      background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
      color: "#03150f",
      fontWeight: 900,
      cursor: "pointer",
    },

    ghost: {
      border: "1px solid rgba(125,255,209,.18)",
      borderRadius: 999,
      padding: "12px 15px",
      background: "rgba(255,255,255,.04)",
      color: "#f4fff9",
      fontWeight: 900,
      cursor: "pointer",
    },

    empty: {
      padding: 24,
      borderRadius: 26,
      background: "rgba(255,255,255,.04)",
      border: "1px solid rgba(125,255,209,.12)",
      color: "rgba(231,255,247,.72)",
    },
  };

  if (loading) {
    return (
      <main style={styles.page}>
        Loading reservations...
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>

        <div style={styles.badge}>
          Host Reservations
        </div>

        <h1 style={styles.title}>
          Reservations.
        </h1>

        <div style={styles.list}>
          {bookings.length ? (
            bookings.map((b) => (
              <div key={b.id} style={styles.card}>

                <div style={styles.top}>
                  <div style={styles.name}>
                    {b.full_name || "MeetOutdoors user"}
                  </div>

                  <div style={styles.status}>
                    {b.status}
                  </div>
                </div>

                <div style={styles.meta}>
                  <div>
                    Package: {b.experience_packages?.title || "Package"}
                  </div>

                  <div>
                    Date: {b.experience_dates?.start_date || "-"}

                    {b.experience_dates?.end_date
                      ? ` - ${b.experience_dates.end_date}`
                      : ""}
                  </div>

                  <div>
                    Persons: {b.persons || 1}
                  </div>

                  {b.email && (
                    <div>
                      Email: {b.email}
                    </div>
                  )}

                  {b.phone && (
                    <div>
                      Phone: {b.phone}
                    </div>
                  )}

                  {b.note && (
                    <div>
                      Note: {b.note}
                    </div>
                  )}
                </div>

                <div style={styles.actions}>

                  <button
                    style={styles.btn}
                    onClick={() =>
                      updateStatus(
                        b.id,
                        "confirmed"
                      )
                    }
                  >
                    Confirm
                  </button>

                  <button
                    style={styles.ghost}
                    onClick={() =>
                      updateStatus(
                        b.id,
                        "rejected"
                      )
                    }
                  >
                    Reject
                  </button>

                  <button
                    style={styles.ghost}
                    onClick={() =>
                      updateStatus(
                        b.id,
                        "cancelled"
                      )
                    }
                  >
                    Cancel
                  </button>

                </div>

              </div>
            ))
          ) : (
            <div style={styles.empty}>
              No reservations yet.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}