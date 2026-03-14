import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [applications, setApplications] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 980 : false
  );

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 980);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function init() {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();

    if (!auth?.user) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUser(auth.user);

    const { data: prof, error: profError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", auth.user.id)
      .single();

    if (profError) {
      console.log("LOAD ADMIN PROFILE ERROR:", profError);
    }

    setProfile(prof || null);

    if (prof?.role === "ADMIN") {
      await loadApplications();
    }

    setLoading(false);
  }

  async function login(e) {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    await init();
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setApplications([]);
  }

  async function loadApplications() {
    const { data, error } = await supabase
      .from("creator_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("LOAD APPLICATIONS ERROR:", error);
      setApplications([]);
      return;
    }

    const apps = data || [];
    const userIds = [...new Set(apps.map((a) => a.user_id).filter(Boolean))];

    let profilesMap = {};

    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          avatar_url,
          city,
          country,
          is_verified,
          is_verified_creator,
          creator_status,
          full_name
        `)
        .in("id", userIds);

      if (profilesError) {
        console.log("LOAD PROFILES FOR APPLICATIONS ERROR:", profilesError);
      } else {
        profilesMap = Object.fromEntries(
          (profilesData || []).map((p) => [p.id, p])
        );
      }
    }

    const merged = apps.map((app) => ({
      ...app,
      profiles: profilesMap[app.user_id] || null,
    }));

    setApplications(merged);
  }

  async function updateProfileForStatus(userId, status) {
    if (!userId) return;

    if (status === "APPROVED") {
      const { error } = await supabase
        .from("profiles")
        .update({
          creator_status: "approved",
          is_verified: true,
          is_verified_creator: true,
        })
        .eq("id", userId);

      if (error) console.log("PROFILE UPDATE APPROVED ERROR:", error);
      return;
    }

    if (status === "REJECTED") {
      const { error } = await supabase
        .from("profiles")
        .update({
          creator_status: "rejected",
          is_verified: false,
          is_verified_creator: false,
        })
        .eq("id", userId);

      if (error) console.log("PROFILE UPDATE REJECTED ERROR:", error);
      return;
    }

    if (status === "PENDING") {
      const { error } = await supabase
        .from("profiles")
        .update({
          creator_status: "pending",
          is_verified: false,
          is_verified_creator: false,
        })
        .eq("id", userId);

      if (error) console.log("PROFILE UPDATE PENDING ERROR:", error);
    }
  }

  async function approve(app) {
    if (!app?.id || !app?.user_id) return;
    setBusyId(app.id);

    const { error } = await supabase
      .from("creator_applications")
      .update({
        status: "APPROVED",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id || null,
      })
      .eq("id", app.id);

    if (error) {
      console.log("APPROVE ERROR:", error);
      setBusyId(null);
      return;
    }

    await updateProfileForStatus(app.user_id, "APPROVED");
    await loadApplications();
    setBusyId(null);
  }

  async function reject(app) {
    if (!app?.id || !app?.user_id) return;
    setBusyId(app.id);

    const { error } = await supabase
      .from("creator_applications")
      .update({
        status: "REJECTED",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id || null,
      })
      .eq("id", app.id);

    if (error) {
      console.log("REJECT ERROR:", error);
      setBusyId(null);
      return;
    }

    await updateProfileForStatus(app.user_id, "REJECTED");
    await loadApplications();
    setBusyId(null);
  }

  async function removeVerification(app) {
    if (!app?.id || !app?.user_id) return;
    setBusyId(app.id);

    const { error } = await supabase
      .from("creator_applications")
      .update({
        status: "REJECTED",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id || null,
      })
      .eq("id", app.id);

    if (error) {
      console.log("REMOVE VERIFICATION ERROR:", error);
      setBusyId(null);
      return;
    }

    await updateProfileForStatus(app.user_id, "REJECTED");
    await loadApplications();
    setBusyId(null);
  }

  async function moveToPending(app) {
    if (!app?.id || !app?.user_id) return;
    setBusyId(app.id);

    const { error } = await supabase
      .from("creator_applications")
      .update({
        status: "PENDING",
        reviewed_at: null,
        reviewed_by: null,
      })
      .eq("id", app.id);

    if (error) {
      console.log("MOVE TO PENDING ERROR:", error);
      setBusyId(null);
      return;
    }

    await updateProfileForStatus(app.user_id, "PENDING");
    await loadApplications();
    setBusyId(null);
  }

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;

    return applications.filter((app) => {
      const fullName = (app?.full_name || "").toLowerCase();
      const mail = (app?.email || app?.profiles?.email || "").toLowerCase();
      const bio = (app?.bio || "").toLowerCase();
      const exp = (app?.experience_text || "").toLowerCase();
      const city = (app?.city || app?.profiles?.city || "").toLowerCase();
      const country = (app?.country || app?.profiles?.country || "").toLowerCase();
      const phone = (app?.phone || "").toLowerCase();
      const brand = (app?.brand_name || "").toLowerCase();

      return (
        fullName.includes(q) ||
        mail.includes(q) ||
        bio.includes(q) ||
        exp.includes(q) ||
        city.includes(q) ||
        country.includes(q) ||
        phone.includes(q) ||
        brand.includes(q)
      );
    });
  }, [applications, search]);

  const pendingApps = useMemo(
    () =>
      filteredApplications.filter(
        (a) => !a.status || String(a.status).toUpperCase() === "PENDING"
      ),
    [filteredApplications]
  );

  const approvedApps = useMemo(
    () =>
      filteredApplications.filter(
        (a) => String(a.status || "").toUpperCase() === "APPROVED"
      ),
    [filteredApplications]
  );

  const rejectedApps = useMemo(
    () =>
      filteredApplications.filter(
        (a) => String(a.status || "").toUpperCase() === "REJECTED"
      ),
    [filteredApplications]
  );

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(900px 420px at 10% 0%, rgba(0,255,195,0.10), transparent 55%)," +
        "radial-gradient(900px 420px at 90% 0%, rgba(124,77,255,0.10), transparent 55%)," +
        "linear-gradient(180deg, #03110d 0%, #020805 50%, #000000 100%)",
      color: "white",
      padding: isMobile ? "14px 12px 28px" : "22px 18px 36px",
      marginTop: -120,
      boxSizing: "border-box",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    },
    wrap: {
      maxWidth: 1480,
      margin: "0 auto",
    },
    glass: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
      backdropFilter: "blur(14px)",
      borderRadius: 24,
    },
    hero: {
      padding: isMobile ? 16 : 20,
      marginBottom: 16,
    },
    heroTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "center",
      flexDirection: isMobile ? "column" : "row",
      gap: 14,
    },
    eyebrow: {
      fontSize: 11,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "rgba(210,255,230,0.72)",
      fontWeight: 800,
      marginBottom: 6,
    },
    title: {
      fontSize: isMobile ? 28 : 38,
      fontWeight: 950,
      lineHeight: 1.03,
      margin: 0,
    },
    subtitle: {
      marginTop: 8,
      color: "rgba(255,255,255,0.72)",
      fontSize: isMobile ? 13 : 14,
      lineHeight: 1.55,
      maxWidth: 780,
    },
    topRight: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
    },
    pill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "9px 12px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      fontSize: 12,
      fontWeight: 900,
      whiteSpace: "nowrap",
    },
    logoutBtn: {
      padding: "10px 16px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 13,
    },
    searchWrap: {
      marginTop: 16,
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1.2fr auto auto",
      gap: 10,
      alignItems: "center",
    },
    searchBox: {
      position: "relative",
    },
    searchInput: {
      width: "100%",
      padding: "14px 16px 14px 44px",
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.05)",
      color: "white",
      fontSize: 14,
      outline: "none",
      boxSizing: "border-box",
    },
    searchIcon: {
      position: "absolute",
      left: 14,
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: 16,
      opacity: 0.75,
    },
    clearBtn: {
      padding: "12px 16px",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.05)",
      color: "white",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 13,
    },
    reloadBtn: {
      padding: "12px 16px",
      borderRadius: 16,
      border: "none",
      background: "linear-gradient(135deg, #00ffc3, #00b4ff, #7c4dff)",
      color: "#02130d",
      cursor: "pointer",
      fontWeight: 950,
      fontSize: 13,
      boxShadow: "0 12px 30px rgba(0,255,195,0.20)",
    },
    statsGrid: {
      marginTop: 16,
      display: "grid",
      gridTemplateColumns: isMobile
        ? "repeat(2, minmax(0, 1fr))"
        : "repeat(4, minmax(0, 1fr))",
      gap: 12,
    },
    statCard: {
      borderRadius: 18,
      padding: 14,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
    },
    statLabel: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: "0.10em",
      opacity: 0.72,
      marginBottom: 8,
      fontWeight: 800,
    },
    statValue: {
      fontSize: isMobile ? 24 : 28,
      fontWeight: 950,
      lineHeight: 1,
    },
    board: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
      gap: 16,
      alignItems: "start",
    },
    column: {
      borderRadius: 24,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: "0 20px 50px rgba(0,0,0,0.32)",
      overflow: "hidden",
      minHeight: 300,
    },
    columnHead: (type) => ({
      padding: "16px 16px 14px",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      background:
        type === "PENDING"
          ? "linear-gradient(135deg, rgba(255,211,107,0.16), rgba(255,160,80,0.10))"
          : type === "APPROVED"
          ? "linear-gradient(135deg, rgba(0,255,176,0.16), rgba(0,190,130,0.10))"
          : "linear-gradient(135deg, rgba(255,80,100,0.14), rgba(180,50,70,0.10))",
    }),
    columnTitleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
    },
    columnTitle: {
      fontSize: 18,
      fontWeight: 950,
    },
    countBadge: (type) => ({
      padding: "6px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 900,
      border:
        type === "PENDING"
          ? "1px solid rgba(255,211,107,0.35)"
          : type === "APPROVED"
          ? "1px solid rgba(0,255,176,0.35)"
          : "1px solid rgba(255,100,120,0.35)",
      background:
        type === "PENDING"
          ? "rgba(255,211,107,0.14)"
          : type === "APPROVED"
          ? "rgba(0,255,176,0.14)"
          : "rgba(255,100,120,0.14)",
      color:
        type === "PENDING"
          ? "#ffd36b"
          : type === "APPROVED"
          ? "#98ffd5"
          : "#ffbec8",
      whiteSpace: "nowrap",
    }),
    columnHint: {
      marginTop: 8,
      fontSize: 12,
      color: "rgba(255,255,255,0.68)",
      lineHeight: 1.45,
    },
    columnBody: {
      padding: 14,
      display: "grid",
      gap: 12,
      maxHeight: isMobile ? "unset" : "calc(100vh - 320px)",
      overflowY: isMobile ? "visible" : "auto",
    },
    empty: {
      borderRadius: 18,
      padding: 16,
      background: "rgba(255,255,255,0.03)",
      border: "1px dashed rgba(255,255,255,0.10)",
      color: "rgba(255,255,255,0.58)",
      fontSize: 13,
      textAlign: "center",
    },
    appCard: {
      borderRadius: 20,
      padding: 14,
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: "0 14px 32px rgba(0,0,0,0.28)",
    },
    appTop: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      marginBottom: 12,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 18,
      objectFit: "cover",
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.06)",
      flexShrink: 0,
    },
    avatarFallback: {
      width: 52,
      height: 52,
      borderRadius: 18,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 950,
      fontSize: 18,
      background:
        "linear-gradient(135deg, rgba(0,255,195,0.16), rgba(124,77,255,0.14))",
      border: "1px solid rgba(255,255,255,0.10)",
      color: "#eafff7",
      flexShrink: 0,
    },
    appName: {
      fontSize: 17,
      fontWeight: 950,
      lineHeight: 1.1,
      wordBreak: "break-word",
    },
    appEmail: {
      marginTop: 4,
      fontSize: 12,
      color: "rgba(255,255,255,0.72)",
      wordBreak: "break-word",
    },
    miniMeta: {
      marginTop: 4,
      fontSize: 11,
      color: "rgba(255,255,255,0.58)",
      lineHeight: 1.4,
    },
    sectionLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "rgba(210,255,230,0.66)",
      fontWeight: 900,
      marginBottom: 6,
    },
    bioBox: {
      marginTop: 10,
      padding: 12,
      borderRadius: 14,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      fontSize: 13,
      lineHeight: 1.55,
      color: "rgba(255,255,255,0.88)",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    linkGrid: {
      marginTop: 10,
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
    },
    docLink: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px 10px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.04)",
      color: "#fff",
      textDecoration: "none",
      fontSize: 11,
      fontWeight: 800,
    },
    actionRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginTop: 12,
    },
    wideActionRow: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 8,
      marginTop: 10,
    },
    btnApprove: {
      padding: "11px 12px",
      borderRadius: 14,
      border: "none",
      background: "linear-gradient(135deg, #00ffb0, #00cf82)",
      color: "#062016",
      fontWeight: 950,
      cursor: "pointer",
      fontSize: 12,
    },
    btnReject: {
      padding: "11px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,110,130,0.35)",
      background: "rgba(255,80,100,0.12)",
      color: "#ffc0ca",
      fontWeight: 950,
      cursor: "pointer",
      fontSize: 12,
    },
    btnPending: {
      padding: "11px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,211,107,0.28)",
      background: "rgba(255,211,107,0.12)",
      color: "#ffd36b",
      fontWeight: 950,
      cursor: "pointer",
      fontSize: 12,
    },
    btnRemove: {
      padding: "11px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,140,160,0.30)",
      background: "rgba(255,255,255,0.05)",
      color: "#ffd7dd",
      fontWeight: 950,
      cursor: "pointer",
      fontSize: 12,
    },
    loginWrap: {
      maxWidth: 460,
      margin: "8vh auto 0",
      padding: isMobile ? 16 : 20,
      borderRadius: 28,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: "0 24px 70px rgba(0,0,0,0.40)",
      backdropFilter: "blur(16px)",
    },
    input: {
      width: "100%",
      padding: "14px 14px",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      outline: "none",
      fontSize: 14,
      boxSizing: "border-box",
    },
    loginBtn: {
      width: "100%",
      padding: "14px 14px",
      borderRadius: 16,
      border: "none",
      background: "linear-gradient(135deg, #00ffc3, #00b4ff, #7c4dff)",
      color: "#03130f",
      fontWeight: 950,
      fontSize: 14,
      cursor: "pointer",
      boxShadow: "0 16px 40px rgba(0,255,195,0.22)",
    },
    err: {
      marginTop: 12,
      padding: "12px 14px",
      borderRadius: 14,
      border: "1px solid rgba(255,110,130,0.28)",
      background: "rgba(255,80,100,0.10)",
      color: "#ffc2cb",
      fontSize: 13,
      fontWeight: 800,
    },
    denied: {
      maxWidth: 560,
      margin: "10vh auto 0",
      padding: 22,
      borderRadius: 26,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: "0 24px 70px rgba(0,0,0,0.40)",
      textAlign: "center",
    },
  };

  function getInitials(name) {
    const safe = (name || "").trim();
    if (!safe) return "A";
    const parts = safe.split(" ").filter(Boolean);
    const a = parts[0]?.[0]?.toUpperCase() || "";
    const b = parts[1]?.[0]?.toUpperCase() || "";
    return (a + b) || "A";
  }

  function formatDateTime(value) {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return "—";
    }
  }

  function ApplicationCard({ app, columnType }) {
    const currentBusy = busyId === app.id;
    const avatarUrl = app?.profiles?.avatar_url || "";
    const emailValue = app?.email || app?.profiles?.email || "No email";
    const cityValue = app?.city || app?.profiles?.city;
    const countryValue = app?.country || app?.profiles?.country;
    const cityCountry = [cityValue, countryValue].filter(Boolean).join(", ");

    const links = [
      app?.instagram_url && { label: "Instagram", href: app.instagram_url },
      app?.website_url && { label: "Website", href: app.website_url },
      app?.tiktok_url && { label: "TikTok", href: app.tiktok_url },
      app?.youtube_url && { label: "YouTube", href: app.youtube_url },
    ].filter(Boolean);

    const docs = [
      app?.id_document_url && { label: "ID Document", href: app.id_document_url },
      app?.selfie_document_url && { label: "Selfie + ID", href: app.selfie_document_url },
      app?.company_document_url && { label: "Company Doc", href: app.company_document_url },
      app?.license_document_url && { label: "License", href: app.license_document_url },
    ].filter(Boolean);

    return (
      <div style={styles.appCard}>
        <div style={styles.appTop}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={styles.avatar} />
          ) : (
            <div style={styles.avatarFallback}>{getInitials(app.full_name)}</div>
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={styles.appName}>{app.full_name || "Unnamed creator"}</div>
            <div style={styles.appEmail}>{emailValue}</div>
            <div style={styles.miniMeta}>
              {cityCountry || "Location not set"} • Created: {formatDateTime(app.created_at)}
            </div>
            <div style={styles.miniMeta}>
              Type: {app.creator_type || "—"} • Brand: {app.brand_name || "—"}
            </div>
          </div>
        </div>

        <div>
          <div style={styles.sectionLabel}>Bio</div>
          <div style={styles.bioBox}>{app.bio || "No bio provided."}</div>
        </div>

        <div>
          <div style={{ ...styles.sectionLabel, marginTop: 10 }}>Experience</div>
          <div style={styles.bioBox}>
            {app.experience_text || "No experience provided."}
          </div>
        </div>

        {Array.isArray(app.activities) && app.activities.length > 0 ? (
          <div>
            <div style={{ ...styles.sectionLabel, marginTop: 10 }}>Activities</div>
            <div style={styles.bioBox}>{app.activities.join(", ")}</div>
          </div>
        ) : null}

        {(app.phone ||
          app.emergency_contact_name ||
          app.emergency_contact_phone ||
          app.has_first_aid !== null ||
          app.has_insurance !== null) && (
          <div>
            <div style={{ ...styles.sectionLabel, marginTop: 10 }}>Safety / Contact</div>
            <div style={styles.bioBox}>
              <div>Phone: {app.phone || "—"}</div>
              <div>Emergency name: {app.emergency_contact_name || "—"}</div>
              <div>Emergency phone: {app.emergency_contact_phone || "—"}</div>
              <div>First aid: {app.has_first_aid ? "Yes" : "No"}</div>
              <div>Insurance: {app.has_insurance ? "Yes" : "No"}</div>
              <div style={{ marginTop: 6 }}>
                Safety notes: {app.safety_notes || "—"}
              </div>
            </div>
          </div>
        )}

        {links.length > 0 ? (
          <div>
            <div style={{ ...styles.sectionLabel, marginTop: 10 }}>Links</div>
            <div style={styles.linkGrid}>
              {links.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.docLink}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {docs.length > 0 ? (
          <div>
            <div style={{ ...styles.sectionLabel, marginTop: 10 }}>Documents</div>
            <div style={styles.linkGrid}>
              {docs.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.docLink}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
          Reviewed: {formatDateTime(app.reviewed_at)}
        </div>

        {columnType === "PENDING" && (
          <div style={styles.actionRow}>
            <button
              type="button"
              onClick={() => approve(app)}
              disabled={currentBusy}
              style={{
                ...styles.btnApprove,
                opacity: currentBusy ? 0.65 : 1,
                cursor: currentBusy ? "not-allowed" : "pointer",
              }}
            >
              {currentBusy ? "Working..." : "Approve"}
            </button>

            <button
              type="button"
              onClick={() => reject(app)}
              disabled={currentBusy}
              style={{
                ...styles.btnReject,
                opacity: currentBusy ? 0.65 : 1,
                cursor: currentBusy ? "not-allowed" : "pointer",
              }}
            >
              {currentBusy ? "Working..." : "Reject"}
            </button>
          </div>
        )}

        {columnType === "APPROVED" && (
          <div style={styles.wideActionRow}>
            <button
              type="button"
              onClick={() => removeVerification(app)}
              disabled={currentBusy}
              style={{
                ...styles.btnRemove,
                opacity: currentBusy ? 0.65 : 1,
                cursor: currentBusy ? "not-allowed" : "pointer",
              }}
            >
              {currentBusy ? "Working..." : "Remove verification"}
            </button>

            <button
              type="button"
              onClick={() => reject(app)}
              disabled={currentBusy}
              style={{
                ...styles.btnReject,
                opacity: currentBusy ? 0.65 : 1,
                cursor: currentBusy ? "not-allowed" : "pointer",
              }}
            >
              {currentBusy ? "Working..." : "Move to rejected"}
            </button>
          </div>
        )}

        {columnType === "REJECTED" && (
          <div style={styles.actionRow}>
            <button
              type="button"
              onClick={() => moveToPending(app)}
              disabled={currentBusy}
              style={{
                ...styles.btnPending,
                opacity: currentBusy ? 0.65 : 1,
                cursor: currentBusy ? "not-allowed" : "pointer",
              }}
            >
              {currentBusy ? "Working..." : "Move to pending"}
            </button>

            <button
              type="button"
              onClick={() => approve(app)}
              disabled={currentBusy}
              style={{
                ...styles.btnApprove,
                opacity: currentBusy ? 0.65 : 1,
                cursor: currentBusy ? "not-allowed" : "pointer",
              }}
            >
              {currentBusy ? "Working..." : "Approve again"}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.wrap}>
          <div style={{ ...styles.glass, padding: 22 }}>Loading admin panel...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.loginWrap}>
          <div style={styles.eyebrow}>Admin access</div>
          <h2 style={{ margin: 0, fontSize: 34, fontWeight: 950 }}>Admin Login</h2>
          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.55,
            }}
          >
            Sign in with your admin account to review creator applications and control verification.
          </div>

          <form
            onSubmit={login}
            style={{ marginTop: 18, display: "grid", gap: 12 }}
          >
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />

            <button type="submit" style={styles.loginBtn}>
              Login to Admin
            </button>
          </form>

          {error ? <div style={styles.err}>{error}</div> : null}
        </div>
      </div>
    );
  }

  if (profile?.role !== "ADMIN") {
    return (
      <div style={styles.page}>
        <div style={styles.denied}>
          <div style={styles.eyebrow}>Restricted</div>
          <div style={{ fontSize: 34, fontWeight: 950 }}>⛔ Access denied</div>
          <div
            style={{
              marginTop: 10,
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.6,
              fontSize: 14,
            }}
          >
            This account does not have admin permissions.
          </div>

          <button
            onClick={logout}
            style={{ ...styles.logoutBtn, marginTop: 16 }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={{ ...styles.glass, ...styles.hero }}>
          <div style={styles.heroTop}>
            <div>
              <div style={styles.eyebrow}>MeetOutdoors control room</div>
              <h1 style={styles.title}>Admin Panel</h1>
              <div style={styles.subtitle}>
                Review creator applications, separate them by status, approve creators, reject them,
                or remove verification at any time — all from one clean dashboard.
              </div>
            </div>

            <div style={styles.topRight}>
              <div style={styles.pill}>👤 {profile?.full_name || user?.email || "Admin"}</div>
              <div style={styles.pill}>🛡️ Role: {profile?.role || "ADMIN"}</div>
              <button onClick={logout} style={styles.logoutBtn}>
                Logout
              </button>
            </div>
          </div>

          <div style={styles.searchWrap}>
            <div style={styles.searchBox}>
              <div style={styles.searchIcon}>🔎</div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, bio, city, country..."
                style={styles.searchInput}
              />
            </div>

            <button
              type="button"
              onClick={() => setSearch("")}
              style={styles.clearBtn}
            >
              Clear
            </button>

            <button
              type="button"
              onClick={loadApplications}
              style={styles.reloadBtn}
            >
              Refresh
            </button>
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Visible applications</div>
              <div style={styles.statValue}>{filteredApplications.length}</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>Pending</div>
              <div style={styles.statValue}>{pendingApps.length}</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>Approved</div>
              <div style={styles.statValue}>{approvedApps.length}</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>Rejected</div>
              <div style={styles.statValue}>{rejectedApps.length}</div>
            </div>
          </div>
        </div>

        <div style={styles.board}>
          <div style={styles.column}>
            <div style={styles.columnHead("PENDING")}>
              <div style={styles.columnTitleRow}>
                <div style={styles.columnTitle}>Pending</div>
                <div style={styles.countBadge("PENDING")}>{pendingApps.length}</div>
              </div>
              <div style={styles.columnHint}>
                New creator requests waiting for review.
              </div>
            </div>

            <div style={styles.columnBody}>
              {pendingApps.length === 0 ? (
                <div style={styles.empty}>No pending applications.</div>
              ) : (
                pendingApps.map((app) => (
                  <ApplicationCard key={app.id} app={app} columnType="PENDING" />
                ))
              )}
            </div>
          </div>

          <div style={styles.column}>
            <div style={styles.columnHead("APPROVED")}>
              <div style={styles.columnTitleRow}>
                <div style={styles.columnTitle}>Approved</div>
                <div style={styles.countBadge("APPROVED")}>{approvedApps.length}</div>
              </div>
              <div style={styles.columnHint}>
                Verified creators currently active on the platform.
              </div>
            </div>

            <div style={styles.columnBody}>
              {approvedApps.length === 0 ? (
                <div style={styles.empty}>No approved creators yet.</div>
              ) : (
                approvedApps.map((app) => (
                  <ApplicationCard key={app.id} app={app} columnType="APPROVED" />
                ))
              )}
            </div>
          </div>

          <div style={styles.column}>
            <div style={styles.columnHead("REJECTED")}>
              <div style={styles.columnTitleRow}>
                <div style={styles.columnTitle}>Rejected</div>
                <div style={styles.countBadge("REJECTED")}>{rejectedApps.length}</div>
              </div>
              <div style={styles.columnHint}>
                Rejected applications that can still be reviewed again later.
              </div>
            </div>

            <div style={styles.columnBody}>
              {rejectedApps.length === 0 ? (
                <div style={styles.empty}>No rejected applications.</div>
              ) : (
                rejectedApps.map((app) => (
                  <ApplicationCard key={app.id} app={app} columnType="REJECTED" />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}