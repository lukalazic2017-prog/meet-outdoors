import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

const ADMIN_PASSWORD = "17012024";

export default function AdminCreatorRequests() {
  const [creatorRequests, setCreatorRequests] = useState([]);
  const [hostRequests, setHostRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [adminPass, setAdminPass] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [passError, setPassError] = useState("");
  const [tab, setTab] = useState("hosts");

  useEffect(() => {
    if (unlocked) {
      loadAllRequests();
    }
  }, [unlocked]);

  async function loadAllRequests() {
    setLoading(true);

    const [creatorResult, hostResult] = await Promise.all([
      supabase
        .from("creator_applications")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("experience_hosts")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (creatorResult.error) {
      console.log("LOAD CREATOR REQUESTS ERROR:", creatorResult.error);
      setCreatorRequests([]);
    } else {
      setCreatorRequests(creatorResult.data || []);
    }

    if (hostResult.error) {
      console.log("LOAD HOST REQUESTS ERROR:", hostResult.error);
      setHostRequests([]);
    } else {
      setHostRequests(hostResult.data || []);
    }

    setLoading(false);
  }

  async function sendNotification(userId, message, link) {
    if (!userId) return;

    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      message,
      link,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.log("NOTIFICATION ERROR:", error);
    }
  }

  async function approveCreator(application) {
    if (!application?.id || !application?.user_id) return;

    setBusyId(`creator-${application.id}`);

    const { error: appError } = await supabase
      .from("creator_applications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (appError) {
      console.log("CREATOR APPROVE ERROR:", appError);
      setBusyId(null);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        creator_status: "approved",
        is_verified: true,
        is_verified_creator: true,
      })
      .eq("id", application.user_id);

    if (profileError) {
      console.log("PROFILE APPROVE ERROR:", profileError);
      setBusyId(null);
      return;
    }

    await sendNotification(
      application.user_id,
      "Congratulations! Your creator application has been approved. You can now create tours.",
      "/create-tour"
    );

    await loadAllRequests();
    setBusyId(null);
  }

  async function rejectCreator(application) {
    if (!application?.id || !application?.user_id) return;

    setBusyId(`creator-${application.id}`);

    const { error: appError } = await supabase
      .from("creator_applications")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (appError) {
      console.log("CREATOR REJECT ERROR:", appError);
      setBusyId(null);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        creator_status: "rejected",
        is_verified: false,
        is_verified_creator: false,
      })
      .eq("id", application.user_id);

    if (profileError) {
      console.log("PROFILE REJECT ERROR:", profileError);
      setBusyId(null);
      return;
    }

    await sendNotification(
      application.user_id,
      "Your creator application was not approved at this time.",
      "/apply-creator"
    );

    await loadAllRequests();
    setBusyId(null);
  }

  async function approveHost(host) {
    if (!host?.id || !host?.owner_id) return;

    setBusyId(`host-${host.id}`);

    const { error } = await supabase
      .from("experience_hosts")
      .update({
        verified: true,
        active: true,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", host.id);

    if (error) {
      console.log("HOST APPROVE ERROR:", error);
      setBusyId(null);
      return;
    }

    await sendNotification(
      host.owner_id,
      `Your host profile "${host.name}" has been approved and verified.`,
      `/host-dashboard/${host.id}`
    );

    await loadAllRequests();
    setBusyId(null);
  }

  async function rejectHost(host) {
    if (!host?.id || !host?.owner_id) return;

    const ok = window.confirm(`Reject host profile "${host.name}"?`);
    if (!ok) return;

    setBusyId(`host-${host.id}`);

    const { error } = await supabase
      .from("experience_hosts")
      .update({
        verified: false,
        active: false,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", host.id);

    if (error) {
      console.log("HOST REJECT ERROR:", error);
      setBusyId(null);
      return;
    }

    await sendNotification(
      host.owner_id,
      `Your host profile "${host.name}" was not approved at this time.`,
      "/create-host"
    );

    await loadAllRequests();
    setBusyId(null);
  }

  async function activateHost(host) {
    if (!host?.id) return;

    setBusyId(`host-${host.id}`);

    const { error } = await supabase
      .from("experience_hosts")
      .update({ active: true })
      .eq("id", host.id);

    if (error) console.log("HOST ACTIVATE ERROR:", error);

    await loadAllRequests();
    setBusyId(null);
  }

  async function deactivateHost(host) {
    if (!host?.id) return;

    setBusyId(`host-${host.id}`);

    const { error } = await supabase
      .from("experience_hosts")
      .update({ active: false })
      .eq("id", host.id);

    if (error) console.log("HOST DEACTIVATE ERROR:", error);

    await loadAllRequests();
    setBusyId(null);
  }

  const counts = useMemo(() => {
    return {
      hostsTotal: hostRequests.length,
      hostsPending: hostRequests.filter((h) => !h.verified || h.active === false).length,
      hostsVerified: hostRequests.filter((h) => h.verified && h.active !== false).length,
      creatorsTotal: creatorRequests.length,
      creatorsPending: creatorRequests.filter((c) => (c.status || "pending") === "pending").length,
      creatorsApproved: creatorRequests.filter((c) => c.status === "approved").length,
    };
  }, [hostRequests, creatorRequests]);

  const styles = {
    page: {
      minHeight: "100vh",
      padding: "28px 16px 70px",
      marginTop: -120,
      background:
        "radial-gradient(circle at top, #071d15 0%, #020806 50%, #000000 100%)",
      color: "white",
      boxSizing: "border-box",
      fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    },

    wrap: {
      maxWidth: 1280,
      margin: "0 auto",
    },

    unlockCard: {
      maxWidth: 460,
      margin: "80px auto 0",
      background:
        "linear-gradient(145deg, rgba(8,24,18,.88), rgba(3,9,7,.96))",
      border: "1px solid rgba(125,255,209,.16)",
      borderRadius: 26,
      padding: 24,
      boxShadow: "0 24px 80px rgba(0,0,0,.55)",
      backdropFilter: "blur(14px)",
    },

    headerCard: {
      position: "relative",
      overflow: "hidden",
      padding: 22,
      borderRadius: 28,
      background:
        "radial-gradient(circle at 100% 0%, rgba(22,245,162,.16), transparent 30%), linear-gradient(145deg, rgba(8,24,18,.86), rgba(3,9,7,.96))",
      border: "1px solid rgba(125,255,209,.16)",
      boxShadow: "0 24px 80px rgba(0,0,0,.42)",
      marginBottom: 18,
    },

    eyebrow: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      color: "#8fffe0",
      marginBottom: 8,
      fontWeight: 950,
    },

    title: {
      fontSize: "clamp(34px, 6vw, 64px)",
      fontWeight: 950,
      letterSpacing: "-.07em",
      lineHeight: 0.9,
      marginBottom: 10,
    },

    subtitle: {
      color: "rgba(231,255,247,.72)",
      fontSize: 14,
      lineHeight: 1.6,
      maxWidth: 760,
    },

    stats: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
      gap: 12,
      marginTop: 18,
    },

    stat: {
      padding: 14,
      borderRadius: 20,
      background: "rgba(255,255,255,.045)",
      border: "1px solid rgba(125,255,209,.12)",
    },

    statNumber: {
      fontSize: 28,
      fontWeight: 950,
      letterSpacing: "-.05em",
    },

    statLabel: {
      marginTop: 4,
      color: "rgba(231,255,247,.58)",
      fontSize: 11,
      fontWeight: 850,
      textTransform: "uppercase",
      letterSpacing: ".08em",
    },

    tabs: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 18,
    },

    tab: (active) => ({
      padding: "12px 16px",
      borderRadius: 999,
      border: active
        ? "1px solid rgba(125,255,209,.30)"
        : "1px solid rgba(255,255,255,.10)",
      background: active ? "rgba(22,245,162,.13)" : "rgba(255,255,255,.045)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 900,
    }),

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
      gap: 16,
    },

    card: {
      background:
        "linear-gradient(145deg, rgba(8,24,18,.76), rgba(3,9,7,.96))",
      border: "1px solid rgba(125,255,209,.13)",
      borderRadius: 26,
      padding: 16,
      boxShadow: "0 22px 64px rgba(0,0,0,.34)",
      backdropFilter: "blur(12px)",
    },

    cardTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 14,
      flexWrap: "wrap",
    },

    cardTitle: {
      fontSize: 22,
      fontWeight: 950,
      letterSpacing: "-.04em",
      lineHeight: 1,
    },

    muted: {
      color: "rgba(255,255,255,0.58)",
      fontSize: 12,
      lineHeight: 1.5,
    },

    sectionTitle: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: "0.10em",
      color: "rgba(210,255,230,0.72)",
      marginBottom: 8,
      fontWeight: 800,
    },

    row: {
      fontSize: 13,
      color: "rgba(255,255,255,0.86)",
      lineHeight: 1.55,
      marginBottom: 5,
      wordBreak: "break-word",
    },

    infoBox: {
      padding: 12,
      borderRadius: 18,
      background: "rgba(255,255,255,.045)",
      border: "1px solid rgba(125,255,209,.10)",
      marginBottom: 12,
    },

    statusPill: (status) => ({
      display: "inline-flex",
      alignItems: "center",
      padding: "6px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 950,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      background:
        status === "approved" || status === "verified"
          ? "rgba(0,255,160,0.14)"
          : status === "rejected" || status === "inactive"
          ? "rgba(255,80,100,0.14)"
          : "rgba(255,211,107,0.14)",
      color:
        status === "approved" || status === "verified"
          ? "#9cffd8"
          : status === "rejected" || status === "inactive"
          ? "#ffb3bf"
          : "#ffd36b",
      border:
        status === "approved" || status === "verified"
          ? "1px solid rgba(0,255,160,0.35)"
          : status === "rejected" || status === "inactive"
          ? "1px solid rgba(255,80,100,0.35)"
          : "1px solid rgba(255,211,107,0.35)",
    }),

    linkBtn: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px 12px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.04)",
      color: "#ffffff",
      textDecoration: "none",
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer",
    },

    approveBtn: {
      padding: "10px 14px",
      borderRadius: 999,
      border: "none",
      background: "linear-gradient(135deg, #00ffb0, #00c97a)",
      color: "#032014",
      fontWeight: 900,
      cursor: "pointer",
      fontSize: 12,
    },

    rejectBtn: {
      padding: "10px 14px",
      borderRadius: 999,
      border: "1px solid rgba(255,120,120,0.35)",
      background: "rgba(255,80,100,0.14)",
      color: "#ffd5db",
      fontWeight: 900,
      cursor: "pointer",
      fontSize: 12,
    },

    ghostBtn: {
      padding: "9px 13px",
      borderRadius: 999,
      border: "1px solid rgba(125,255,209,.18)",
      background: "rgba(255,255,255,.045)",
      color: "#fff",
      fontWeight: 850,
      cursor: "pointer",
      fontSize: 12,
    },

    actions: {
      display: "flex",
      gap: 9,
      flexWrap: "wrap",
      marginTop: 12,
    },

    input: {
      width: "100%",
      padding: "14px 16px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.04)",
      color: "white",
      fontSize: 14,
      outline: "none",
      boxSizing: "border-box",
      marginBottom: 12,
    },

    error: {
      marginBottom: 12,
      fontSize: 13,
      color: "#ffb3bf",
      background: "rgba(255,80,100,0.10)",
      border: "1px solid rgba(255,80,100,0.22)",
      borderRadius: 12,
      padding: "10px 12px",
    },

    empty: {
      color: "rgba(255,255,255,0.58)",
      fontSize: 13,
      padding: 18,
      borderRadius: 20,
      background: "rgba(255,255,255,.04)",
      border: "1px solid rgba(255,255,255,.08)",
    },
  };

  if (!unlocked) {
    return (
      <div style={styles.page}>
        <div style={styles.unlockCard}>
          <div style={styles.eyebrow}>Protected admin area</div>

          <div style={{ ...styles.title, fontSize: 34 }}>
            Admin Access
          </div>

          <div style={styles.subtitle}>
            Enter the temporary admin password to open creator and host requests.
          </div>

          <div style={{ height: 18 }} />

          <input
            type="password"
            value={adminPass}
            onChange={(e) => {
              setAdminPass(e.target.value);
              setPassError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (adminPass === ADMIN_PASSWORD) {
                  setUnlocked(true);
                  setPassError("");
                } else {
                  setPassError("Wrong password.");
                }
              }
            }}
            placeholder="Enter admin password"
            style={styles.input}
          />

          {passError ? <div style={styles.error}>{passError}</div> : null}

          <button
            type="button"
            onClick={() => {
              if (adminPass === ADMIN_PASSWORD) {
                setUnlocked(true);
                setPassError("");
              } else {
                setPassError("Wrong password.");
              }
            }}
            style={{ ...styles.approveBtn, width: "100%", padding: "13px 16px" }}
          >
            Enter admin panel
          </button>
        </div>
      </div>
    );
  }

  const renderLinks = (items) => {
    const visible = items.filter((x) => x.url);

    if (!visible.length) {
      return <div style={styles.muted}>No links provided.</div>;
    }

    return (
      <div style={styles.actions}>
        {visible.map((item) => (
          <a
            key={item.label}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.linkBtn}
          >
            {item.label}
          </a>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.headerCard}>
          <div style={styles.eyebrow}>Admin Control Center</div>

          <div style={styles.title}>Approvals & verification.</div>

          <div style={styles.subtitle}>
            Review creator applications and experience host profiles. Approving a host makes
            the profile active and verified on public booking pages.
          </div>

          <div style={styles.stats}>
            <div style={styles.stat}>
              <div style={styles.statNumber}>{counts.hostsTotal}</div>
              <div style={styles.statLabel}>Hosts total</div>
            </div>

            <div style={styles.stat}>
              <div style={styles.statNumber}>{counts.hostsPending}</div>
              <div style={styles.statLabel}>Hosts pending</div>
            </div>

            <div style={styles.stat}>
              <div style={styles.statNumber}>{counts.hostsVerified}</div>
              <div style={styles.statLabel}>Hosts verified</div>
            </div>

            <div style={styles.stat}>
              <div style={styles.statNumber}>{counts.creatorsTotal}</div>
              <div style={styles.statLabel}>Creators total</div>
            </div>

            <div style={styles.stat}>
              <div style={styles.statNumber}>{counts.creatorsPending}</div>
              <div style={styles.statLabel}>Creators pending</div>
            </div>

            <div style={styles.stat}>
              <div style={styles.statNumber}>{counts.creatorsApproved}</div>
              <div style={styles.statLabel}>Creators approved</div>
            </div>
          </div>
        </div>

        <div style={styles.tabs}>
          <button style={styles.tab(tab === "hosts")} onClick={() => setTab("hosts")}>
            Host approvals
          </button>

          <button
            style={styles.tab(tab === "creators")}
            onClick={() => setTab("creators")}
          >
            Creator requests
          </button>

          <button style={styles.ghostBtn} onClick={loadAllRequests}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={styles.empty}>Loading requests...</div>
        ) : tab === "hosts" ? (
          hostRequests.length === 0 ? (
            <div style={styles.empty}>No host profiles yet.</div>
          ) : (
            <div style={styles.grid}>
              {hostRequests.map((host) => {
                const hostStatus =
                  host.verified && host.active !== false
                    ? "verified"
                    : host.active === false
                    ? "inactive"
                    : "pending";

                return (
                  <div key={host.id} style={styles.card}>
                    <div style={styles.cardTop}>
                      <div>
                        <div style={styles.cardTitle}>{host.name || "Unnamed host"}</div>
                        <div style={styles.muted}>
                          {host.email || "No email"} • {host.phone || "No phone"}
                        </div>
                      </div>

                      <div style={styles.statusPill(hostStatus)}>{hostStatus}</div>
                    </div>

                    <div style={styles.infoBox}>
                      <div style={styles.sectionTitle}>Basic info</div>
                      <div style={styles.row}>🏷️ Category: {host.category || "—"}</div>
                      <div style={styles.row}>📍 Location: {host.location || "—"}</div>
                      <div style={styles.row}>🏠 Address: {host.address || "—"}</div>
                      <div style={styles.row}>🌍 Country: {host.country || "—"}</div>
                      <div style={styles.row}>🔗 Slug: /host/{host.slug || "—"}</div>
                    </div>

                    <div style={styles.infoBox}>
                      <div style={styles.sectionTitle}>Description</div>
                      <div style={styles.row}>
                        {host.description || host.short_description || "No description."}
                      </div>
                    </div>

                    <div style={styles.infoBox}>
                      <div style={styles.sectionTitle}>Payment / map</div>
                      <div style={styles.row}>
                        Payment: {host.payment_instructions || "No payment instructions."}
                      </div>
                      <div style={styles.row}>Map: {host.map_url || "—"}</div>
                    </div>

                    <div style={styles.infoBox}>
                      <div style={styles.sectionTitle}>Links</div>
                      {renderLinks([
                        { label: "Public profile", url: host.slug ? `/host/${host.slug}` : "" },
                        { label: "Website", url: host.website },
                        { label: "Instagram", url: host.instagram },
                        { label: "Cover", url: host.cover_url },
                        { label: "Logo", url: host.logo_url },
                        { label: "Map", url: host.map_url },
                      ])}
                    </div>

                    <div style={styles.infoBox}>
                      <div style={styles.sectionTitle}>Meta</div>
                      <div style={styles.row}>
                        Created:{" "}
                        {host.created_at ? new Date(host.created_at).toLocaleString() : "—"}
                      </div>
                      <div style={styles.row}>
                        Reviewed:{" "}
                        {host.reviewed_at
                          ? new Date(host.reviewed_at).toLocaleString()
                          : "Not reviewed"}
                      </div>
                      <div style={styles.row}>Owner ID: {host.owner_id || "—"}</div>
                    </div>

                    <div style={styles.actions}>
                      <button
                        type="button"
                        onClick={() => approveHost(host)}
                        disabled={busyId === `host-${host.id}` || hostStatus === "verified"}
                        style={{
                          ...styles.approveBtn,
                          opacity:
                            busyId === `host-${host.id}` || hostStatus === "verified"
                              ? 0.6
                              : 1,
                          cursor:
                            busyId === `host-${host.id}` || hostStatus === "verified"
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {busyId === `host-${host.id}` ? "Working..." : "Approve host"}
                      </button>

                      <button
                        type="button"
                        onClick={() => rejectHost(host)}
                        disabled={busyId === `host-${host.id}` || hostStatus === "inactive"}
                        style={{
                          ...styles.rejectBtn,
                          opacity:
                            busyId === `host-${host.id}` || hostStatus === "inactive"
                              ? 0.6
                              : 1,
                          cursor:
                            busyId === `host-${host.id}` || hostStatus === "inactive"
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        Reject / deactivate
                      </button>

                      {host.active === false ? (
                        <button
                          type="button"
                          onClick={() => activateHost(host)}
                          style={styles.ghostBtn}
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => deactivateHost(host)}
                          style={styles.ghostBtn}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : creatorRequests.length === 0 ? (
          <div style={styles.empty}>No creator applications yet.</div>
        ) : (
          <div style={styles.grid}>
            {creatorRequests.map((app) => (
              <div key={app.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.cardTitle}>
                      {app.full_name || "Unnamed applicant"}
                    </div>
                    <div style={styles.muted}>{app.email || "No email provided"}</div>
                  </div>

                  <div style={styles.statusPill(app.status || "pending")}>
                    {app.status || "pending"}
                  </div>
                </div>

                <div style={styles.infoBox}>
                  <div style={styles.sectionTitle}>Basic Info</div>
                  <div style={styles.row}>📞 {app.phone || "—"}</div>
                  <div style={styles.row}>
                    📍 {[app.city, app.country].filter(Boolean).join(", ") || "—"}
                  </div>
                  <div style={styles.row}>🧭 Type: {app.creator_type || "—"}</div>
                  <div style={styles.row}>🏷️ Brand: {app.brand_name || "—"}</div>
                </div>

                <div style={styles.infoBox}>
                  <div style={styles.sectionTitle}>Bio</div>
                  <div style={styles.row}>{app.bio || "No bio provided."}</div>
                </div>

                <div style={styles.infoBox}>
                  <div style={styles.sectionTitle}>Experience</div>
                  <div style={styles.row}>
                    {app.experience_text || "No experience provided."}
                  </div>
                </div>

                <div style={styles.infoBox}>
                  <div style={styles.sectionTitle}>Activities</div>
                  <div style={styles.row}>
                    {Array.isArray(app.activities) && app.activities.length > 0
                      ? app.activities.join(", ")
                      : "No activities listed."}
                  </div>
                </div>

                <div style={styles.infoBox}>
                  <div style={styles.sectionTitle}>Links</div>
                  {renderLinks([
                    { label: "Instagram", url: app.instagram_url },
                    { label: "Website", url: app.website_url },
                    { label: "TikTok", url: app.tiktok_url },
                    { label: "YouTube", url: app.youtube_url },
                  ])}
                </div>

                <div style={styles.infoBox}>
                  <div style={styles.sectionTitle}>Documents</div>
                  {renderLinks([
                    { label: "ID Document", url: app.id_document_url },
                    { label: "Selfie + Document", url: app.selfie_document_url },
                    { label: "Company Document", url: app.company_document_url },
                    { label: "License", url: app.license_document_url },
                  ])}
                </div>

                <div style={styles.infoBox}>
                  <div style={styles.sectionTitle}>Safety</div>
                  <div style={styles.row}>⛑️ First aid: {app.has_first_aid ? "Yes" : "No"}</div>
                  <div style={styles.row}>🛡️ Insurance: {app.has_insurance ? "Yes" : "No"}</div>
                  <div style={styles.row}>
                    🚨 Emergency:{" "}
                    {[app.emergency_contact_name, app.emergency_contact_phone]
                      .filter(Boolean)
                      .join(" / ") || "—"}
                  </div>
                  <div style={styles.row}>📝 {app.safety_notes || "No safety notes."}</div>
                </div>

                <div style={styles.infoBox}>
                  <div style={styles.sectionTitle}>Meta</div>
                  <div style={styles.row}>
                    Created:{" "}
                    {app.created_at ? new Date(app.created_at).toLocaleString() : "—"}
                  </div>
                  <div style={styles.row}>
                    Reviewed:{" "}
                    {app.reviewed_at
                      ? new Date(app.reviewed_at).toLocaleString()
                      : "Not reviewed"}
                  </div>
                </div>

                <div style={styles.actions}>
                  <button
                    type="button"
                    onClick={() => approveCreator(app)}
                    disabled={busyId === `creator-${app.id}` || app.status === "approved"}
                    style={{
                      ...styles.approveBtn,
                      opacity:
                        busyId === `creator-${app.id}` || app.status === "approved"
                          ? 0.6
                          : 1,
                      cursor:
                        busyId === `creator-${app.id}` || app.status === "approved"
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {busyId === `creator-${app.id}` ? "Working..." : "Approve creator"}
                  </button>

                  <button
                    type="button"
                    onClick={() => rejectCreator(app)}
                    disabled={busyId === `creator-${app.id}` || app.status === "rejected"}
                    style={{
                      ...styles.rejectBtn,
                      opacity:
                        busyId === `creator-${app.id}` || app.status === "rejected"
                          ? 0.6
                          : 1,
                      cursor:
                        busyId === `creator-${app.id}` || app.status === "rejected"
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Reject creator
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
