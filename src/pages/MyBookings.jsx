import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const FALLBACK =
  "https://images.pexels.com/photos/1732278/pexels-photo-1732278.jpeg";

function formatDateRange(start, end) {
  if (!start) return "Date soon";

  const s = new Date(start);
  const e = end ? new Date(end) : null;

  if (Number.isNaN(s.getTime())) return start;

  const startLabel = s.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!e || Number.isNaN(e.getTime())) return startLabel;

  const endLabel = e.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${startLabel} - ${endLabel}`;
}

function normalizePhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/[^\d+]/g, "");
}

export default function MyBookings() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      setUser(null);
      setBookings([]);
      setLoading(false);
      return;
    }

    setUser(userData.user);

    const { data, error } = await supabase
      .from("experience_bookings")
      .select(
        "*, experience_hosts(*), experience_packages(*), experience_dates(start_date,end_date,total_spots,free_spots)"
      )
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setBookings([]);
    } else {
      setBookings(data || []);
    }

    setLoading(false);
  }

  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return bookings;
    return bookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter]);

  const stats = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((x) => x.status === "pending").length,
      deposit_waiting: bookings.filter((x) => x.status === "deposit_waiting").length,
      confirmed: bookings.filter((x) => x.status === "confirmed").length,
      completed: bookings.filter((x) => x.status === "completed").length,
      rejected: bookings.filter((x) => x.status === "rejected").length,
      cancelled: bookings.filter((x) => x.status === "cancelled").length,
    };
  }, [bookings]);

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at 50% -10%, rgba(22,245,162,.16), transparent 34%), radial-gradient(circle at 90% 10%, rgba(64,231,255,.10), transparent 28%), linear-gradient(180deg,#010302,#06120d)",
      color: "#f4fff9",
      padding: "100px 16px 120px",
      fontFamily:
        "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },

    wrap: {
      maxWidth: 1220,
      margin: "0 auto",
    },

    hero: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 38,
      padding: 24,
      background:
        "radial-gradient(circle at 90% 0%, rgba(22,245,162,.16), transparent 32%), linear-gradient(145deg,rgba(8,24,18,.86),rgba(4,10,8,.98))",
      border: "1px solid rgba(125,255,209,.18)",
      boxShadow: "0 30px 90px rgba(0,0,0,.30)",
      marginBottom: 24,
    },

    badge: {
      display: "inline-flex",
      padding: "8px 12px",
      borderRadius: 999,
      background: "rgba(22,245,162,.12)",
      border: "1px solid rgba(125,255,209,.20)",
      color: "#8fffe0",
      fontSize: 11,
      fontWeight: 950,
      letterSpacing: ".12em",
      textTransform: "uppercase",
    },

    title: {
      marginTop: 16,
      fontSize: "clamp(44px, 8vw, 84px)",
      lineHeight: 0.88,
      fontWeight: 950,
      letterSpacing: "-.08em",
      maxWidth: 820,
    },

    subtitle: {
      marginTop: 14,
      color: "rgba(231,255,247,.76)",
      lineHeight: 1.6,
      maxWidth: 720,
      fontWeight: 650,
    },

    stats: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
      gap: 12,
      marginTop: 22,
    },

    stat: {
      padding: 16,
      borderRadius: 22,
      background: "rgba(255,255,255,.045)",
      border: "1px solid rgba(125,255,209,.12)",
    },

    statNumber: {
      fontSize: 30,
      fontWeight: 950,
      letterSpacing: "-.05em",
    },

    statLabel: {
      marginTop: 4,
      color: "rgba(231,255,247,.60)",
      fontSize: 11,
      fontWeight: 850,
      textTransform: "uppercase",
      letterSpacing: ".08em",
    },

    filters: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 22,
    },

    filter: (active) => ({
      border: active
        ? "1px solid rgba(125,255,209,.30)"
        : "1px solid rgba(255,255,255,.08)",
      background: active ? "rgba(22,245,162,.12)" : "rgba(255,255,255,.035)",
      color: "#fff",
      padding: "11px 14px",
      borderRadius: 999,
      fontWeight: 900,
      cursor: "pointer",
      textTransform: "capitalize",
    }),

    grid: {
      display: "grid",
      gap: 16,
    },

    card: {
      display: "grid",
      gridTemplateColumns: "minmax(220px,.8fr) minmax(0,1.2fr)",
      overflow: "hidden",
      borderRadius: 32,
      background:
        "linear-gradient(155deg, rgba(9,25,19,.86), rgba(3,9,7,.97))",
      border: "1px solid rgba(125,255,209,.16)",
      boxShadow: "0 26px 80px rgba(0,0,0,.24)",
    },

    imageWrap: {
      position: "relative",
      minHeight: 260,
      overflow: "hidden",
    },

    image: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      filter: "saturate(1.08) contrast(1.05)",
    },

    imageOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(to top, rgba(1,3,2,.90), rgba(1,3,2,.05) 62%)",
    },

    imageBadge: {
      position: "absolute",
      left: 14,
      top: 14,
      padding: "7px 11px",
      borderRadius: 999,
      background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
      color: "#03150f",
      fontSize: 11,
      fontWeight: 950,
      letterSpacing: ".08em",
      textTransform: "uppercase",
    },

    body: {
      padding: 20,
    },

    topRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
      flexWrap: "wrap",
    },

    cardTitle: {
      fontSize: "clamp(28px,4.8vw,46px)",
      lineHeight: 0.92,
      fontWeight: 950,
      letterSpacing: "-.07em",
      margin: 0,
    },

    hostName: {
      marginTop: 8,
      color: "rgba(231,255,247,.70)",
      fontWeight: 800,
    },

    status: (status) => ({
      display: "inline-flex",
      padding: "8px 11px",
      borderRadius: 999,
      background:
        status === "confirmed" || status === "completed"
          ? "rgba(22,245,162,.14)"
          : status === "rejected" || status === "cancelled"
          ? "rgba(255,80,80,.12)"
          : "rgba(244,208,111,.10)",
      color:
        status === "confirmed" || status === "completed"
          ? "#8fffe0"
          : status === "rejected" || status === "cancelled"
          ? "#ffd1d1"
          : "#f7e2a2",
      fontSize: 11,
      fontWeight: 950,
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }),

    infoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
      gap: 10,
      marginTop: 16,
    },

    info: {
      padding: 13,
      borderRadius: 18,
      background: "rgba(255,255,255,.045)",
      border: "1px solid rgba(125,255,209,.12)",
    },

    infoLabel: {
      color: "rgba(231,255,247,.52)",
      fontSize: 10,
      fontWeight: 950,
      letterSpacing: ".10em",
      textTransform: "uppercase",
      marginBottom: 6,
    },

    infoValue: {
      color: "#f4fff9",
      fontWeight: 900,
      overflowWrap: "anywhere",
    },

    warning: {
      marginTop: 14,
      padding: 14,
      borderRadius: 20,
      background: "rgba(244,208,111,.09)",
      border: "1px solid rgba(244,208,111,.22)",
      color: "#f7e2a2",
      lineHeight: 1.55,
      fontSize: 13,
      fontWeight: 750,
    },

    actions: {
      display: "flex",
      gap: 9,
      flexWrap: "wrap",
      marginTop: 16,
    },

    button: {
      border: "none",
      padding: "12px 14px",
      borderRadius: 999,
      background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
      color: "#03150f",
      fontWeight: 950,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },

    ghost: {
      border: "1px solid rgba(125,255,209,.20)",
      padding: "11px 14px",
      borderRadius: 999,
      background: "rgba(255,255,255,.045)",
      color: "#f4fff9",
      fontWeight: 850,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },

    empty: {
      padding: 24,
      borderRadius: 30,
      background:
        "linear-gradient(145deg, rgba(8,24,18,.74), rgba(3,9,7,.94))",
      border: "1px solid rgba(125,255,209,.14)",
      color: "rgba(231,255,247,.70)",
      lineHeight: 1.6,
    },

    mobileCSS: `
      @media (max-width: 850px) {
        .mo-booking-card {
          grid-template-columns: 1fr !important;
        }
      }
    `,
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.wrap}>Loading bookings...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={styles.page}>
        <div style={styles.wrap}>
          <div style={styles.empty}>
            You need to log in to see your bookings.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <section style={styles.hero}>
          <div style={styles.badge}>My Experience Bookings</div>

          <h1 style={styles.title}>
            Your outdoor
            <br />
            reservations.
          </h1>

          <div style={styles.subtitle}>
            Track your experience bookings, deposit status, host contact details and confirmed dates.
          </div>

          <div style={styles.stats}>
            <div style={styles.stat}>
              <div style={styles.statNumber}>{stats.all}</div>
              <div style={styles.statLabel}>Total</div>
            </div>

            <div style={styles.stat}>
              <div style={styles.statNumber}>{stats.deposit_waiting}</div>
              <div style={styles.statLabel}>Deposit waiting</div>
            </div>

            <div style={styles.stat}>
              <div style={styles.statNumber}>{stats.confirmed}</div>
              <div style={styles.statLabel}>Confirmed</div>
            </div>

            <div style={styles.stat}>
              <div style={styles.statNumber}>{stats.completed}</div>
              <div style={styles.statLabel}>Completed</div>
            </div>
          </div>
        </section>

        <div style={styles.filters}>
          {[
            ["all", "All"],
            ["pending", "Pending"],
            ["deposit_waiting", "Deposit waiting"],
            ["confirmed", "Confirmed"],
            ["completed", "Completed"],
            ["rejected", "Rejected"],
            ["cancelled", "Cancelled"],
          ].map(([value, label]) => (
            <button
              key={value}
              style={styles.filter(statusFilter === value)}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredBookings.length ? (
          <div style={styles.grid}>
            {filteredBookings.map((booking) => {
              const host = booking.experience_hosts;
              const pkg = booking.experience_packages;
              const date = booking.experience_dates;
              const requiresDeposit = pkg?.deposit_required;
              const phone = host?.whatsapp || host?.phone;
              const cleanPhone = normalizePhone(phone);

              return (
                <article key={booking.id} className="mo-booking-card" style={styles.card}>
                  <div style={styles.imageWrap}>
                    <img
                      src={pkg?.cover_url || host?.cover_url || FALLBACK}
                      alt={pkg?.title || "Experience"}
                      style={styles.image}
                    />
                    <div style={styles.imageOverlay} />
                    <div style={styles.imageBadge}>{booking.status}</div>
                  </div>

                  <div style={styles.body}>
                    <div style={styles.topRow}>
                      <div>
                        <h2 style={styles.cardTitle}>
                          {pkg?.title || "Experience booking"}
                        </h2>
                        <div style={styles.hostName}>
                          {host?.name || "Experience host"}
                        </div>
                      </div>

                      <div style={styles.status(booking.status)}>
                        {booking.status}
                      </div>
                    </div>

                    <div style={styles.infoGrid}>
                      <div style={styles.info}>
                        <div style={styles.infoLabel}>Date</div>
                        <div style={styles.infoValue}>
                          {formatDateRange(date?.start_date, date?.end_date)}
                        </div>
                      </div>

                      <div style={styles.info}>
                        <div style={styles.infoLabel}>Persons</div>
                        <div style={styles.infoValue}>{booking.persons || 1}</div>
                      </div>

                      <div style={styles.info}>
                        <div style={styles.infoLabel}>Price</div>
                        <div style={styles.infoValue}>
                          {pkg?.price
                            ? `${pkg.price} ${pkg.currency || "EUR"}`
                            : "Price on request"}
                        </div>
                      </div>

                      <div style={styles.info}>
                        <div style={styles.infoLabel}>Location</div>
                        <div style={styles.infoValue}>
                          {host?.location || host?.address || "Not set"}
                        </div>
                      </div>
                    </div>

                    {requiresDeposit ? (
                      <div style={styles.warning}>
                        Deposit required: {pkg.deposit_amount || booking.deposit_amount || 0}{" "}
                        {pkg.currency || "EUR"}
                        <br />
                        Status is confirmed only after the host verifies your deposit.
                        <br />
                        Instructions:{" "}
                        {pkg.deposit_instructions ||
                          host?.payment_instructions ||
                          "Host will contact you with payment details."}
                      </div>
                    ) : (
                      <div style={styles.warning}>
                        No deposit required. Wait for host confirmation.
                      </div>
                    )}

                    {booking.note ? (
                      <div style={styles.warning}>
                        Your note:
                        <br />
                        {booking.note}
                      </div>
                    ) : null}

                    <div style={styles.actions}>
                      {host?.slug ? (
                        <button
                          style={styles.button}
                          onClick={() => navigate(`/host/${host.slug}`)}
                        >
                          Open host profile
                        </button>
                      ) : null}

                      {host?.email ? (
                        <button
                          style={styles.ghost}
                          onClick={() =>
                            (window.location.href = `mailto:${host.email}?subject=MeetOutdoors booking - ${pkg?.title || "Experience"}`)
                          }
                        >
                          Email host
                        </button>
                      ) : null}

                      {cleanPhone ? (
                        <button
                          style={styles.ghost}
                          onClick={() => window.open(`https://wa.me/${cleanPhone}`, "_blank")}
                        >
                          WhatsApp
                        </button>
                      ) : null}

                      {host?.map_url ? (
                        <button
                          style={styles.ghost}
                          onClick={() => window.open(host.map_url, "_blank")}
                        >
                          Open map
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div style={styles.empty}>
            No bookings found for this filter.
          </div>
        )}
      </div>

      <style>{styles.mobileCSS}</style>
    </main>
  );
}
