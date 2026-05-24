import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

const FALLBACK =
  "https://images.pexels.com/photos/1732278/pexels-photo-1732278.jpeg";

const STORAGE_BUCKET = "experience";

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

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  return String(value)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function joinArray(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function normalizePhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/[^\d+]/g, "");
}

function statusLabel(status) {
  if (!status) return "pending";
  return String(status).replace(/_/g, " ");
}

export default function HostDashboard() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState(null);
  const [packages, setPackages] = useState([]);
  const [dates, setDates] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("overview");
  const [currentUser, setCurrentUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const [editingPackage, setEditingPackage] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingPackage, setSavingPackage] = useState(false);
  const [packageError, setPackageError] = useState("");
  const [uploading, setUploading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setAccessDenied(false);

    const { data: authData } = await supabase.auth.getUser();
    const me = authData?.user || null;
    setCurrentUser(me);

    if (!me) {
      setHost(null);
      setPackages([]);
      setBookings([]);
      setDates([]);
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    const { data: hostData, error: hostError } = await supabase
      .from("experience_hosts")
      .select("*")
      .eq("id", id)
      .single();

    if (hostError || !hostData) {
      setHost(null);
      setPackages([]);
      setBookings([]);
      setDates([]);
      setLoading(false);
      return;
    }

    if (hostData.owner_id !== me.id) {
      setHost(hostData);
      setPackages([]);
      setBookings([]);
      setDates([]);
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    const [{ data: packageData }, { data: bookingData }] = await Promise.all([
      supabase
        .from("experience_packages")
        .select("*")
        .eq("host_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("experience_bookings")
        .select(
          "*, experience_packages(*), experience_dates(start_date,end_date,total_spots,free_spots)"
        )
        .eq("host_id", id)
        .order("created_at", { ascending: false }),
    ]);

    let dateData = [];

    if (packageData?.length) {
      const ids = packageData.map((x) => x.id);

      const { data } = await supabase
        .from("experience_dates")
        .select("*")
        .in("package_id", ids)
        .order("start_date", { ascending: true });

      dateData = data || [];
    }

    setHost(hostData);
    setPackages(packageData || []);
    setBookings(bookingData || []);
    setDates(dateData);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function updateBookingStatus(bookingId, status) {
    if (accessDenied || !currentUser || host?.owner_id !== currentUser.id) return;

    const payload = { status };

    if (status === "confirmed") {
      payload.confirmed_at = new Date().toISOString();
      payload.deposit_verified = true;
      payload.deposit_verified_at = new Date().toISOString();
    }

    if (status === "cancelled") payload.cancelled_at = new Date().toISOString();
    if (status === "completed") payload.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from("experience_bookings")
      .update(payload)
      .eq("id", bookingId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  }

  async function uploadImage(file) {
    if (accessDenied || !currentUser || host?.owner_id !== currentUser.id) return null;
    if (!file || !host?.id) return null;

    setUploading(true);

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `hosts/${host.id}/${fileName}`;

    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      setUploading(false);
      throw error;
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    setUploading(false);

    return data.publicUrl;
  }

  async function handleCoverUpload(file) {
    try {
      const url = await uploadImage(file);
      if (!url) return;

      setEditForm((prev) => ({
        ...prev,
        cover_url: url,
      }));
    } catch (err) {
      setUploading(false);
      alert(err.message);
    }
  }

  async function handleGalleryUpload(files) {
    try {
      const list = Array.from(files || []);
      if (!list.length) return;

      const uploaded = [];

      for (const file of list) {
        const url = await uploadImage(file);
        if (url) uploaded.push(url);
      }

      setEditForm((prev) => ({
        ...prev,
        gallery_urls: [...(prev.gallery_urls || []), ...uploaded],
      }));
    } catch (err) {
      setUploading(false);
      alert(err.message);
    }
  }

  function removeGalleryImage(index) {
    setEditForm((prev) => ({
      ...prev,
      gallery_urls: (prev.gallery_urls || []).filter((_, i) => i !== index),
    }));
  }

  function openEditPackage(pkg) {
    setPackageError("");
    setEditingPackage(pkg);
    setEditForm({
      title: pkg.title || "",
      description: pkg.description || "",
      duration: pkg.duration || "",
      price: pkg.price || "",
      currency: pkg.currency || "EUR",
      cover_url: pkg.cover_url || "",
      included: joinArray(pkg.included),
      not_included: joinArray(pkg.not_included),
      gallery_urls: Array.isArray(pkg.gallery_urls) ? pkg.gallery_urls : [],
      deposit_required: !!pkg.deposit_required,
      deposit_amount: pkg.deposit_amount || "",
      deposit_instructions: pkg.deposit_instructions || "",
      active: pkg.active !== false,
    });
  }

  async function savePackageEdit() {
    if (accessDenied || !currentUser || host?.owner_id !== currentUser.id) return;
    if (!editingPackage || !editForm) return;

    setPackageError("");

    if (!editForm.title.trim()) {
      setPackageError("Package title is required.");
      return;
    }

    if (editForm.deposit_required && !editForm.deposit_amount) {
      setPackageError("Deposit amount is required when deposit is enabled.");
      return;
    }

    setSavingPackage(true);

    const payload = {
      title: editForm.title.trim(),
      description: editForm.description || null,
      duration: editForm.duration || null,
      price: editForm.price ? Number(editForm.price) : null,
      currency: editForm.currency || "EUR",
      cover_url: editForm.cover_url || null,
      included: toArray(editForm.included),
      not_included: toArray(editForm.not_included),
      gallery_urls: editForm.gallery_urls || [],
      deposit_required: !!editForm.deposit_required,
      deposit_amount: editForm.deposit_required ? Number(editForm.deposit_amount || 0) : 0,
      deposit_instructions: editForm.deposit_required ? editForm.deposit_instructions || null : null,
      active: !!editForm.active,
    };

    const { error } = await supabase
      .from("experience_packages")
      .update(payload)
      .eq("id", editingPackage.id);

    setSavingPackage(false);

    if (error) {
      setPackageError(error.message);
      return;
    }

    setEditingPackage(null);
    setEditForm(null);
    await loadData();
  }

  async function deletePackage(pkg) {
    if (accessDenied || !currentUser || host?.owner_id !== currentUser.id) return;

    const ok = window.confirm(
      `Delete package "${pkg.title}"? This can also remove connected dates/bookings depending on your database relations.`
    );

    if (!ok) return;

    const { error } = await supabase.from("experience_packages").delete().eq("id", pkg.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  }

  const stats = useMemo(() => {
    const totalSpots = dates.reduce((a, b) => a + (b.total_spots || 0), 0);
    const freeSpots = dates.reduce((a, b) => a + (b.free_spots || 0), 0);

    const activePackages = packages.filter((p) => p.active !== false).length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const depositWaiting = bookings.filter((b) => b.status === "deposit_waiting").length;
    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const rejected = bookings.filter((b) => b.status === "rejected").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;

    const estimatedRevenue = bookings.reduce((sum, booking) => {
      const pkg = booking.experience_packages;
      if (!["confirmed", "completed"].includes(booking.status)) return sum;
      return sum + Number(pkg?.price || 0) * Number(booking.persons || 1);
    }, 0);

    const confirmedDeposits = bookings.reduce((sum, booking) => {
      const pkg = booking.experience_packages;
      if (!["confirmed", "completed"].includes(booking.status)) return sum;
      if (!pkg?.deposit_required) return sum;
      return sum + Number(pkg.deposit_amount || booking.deposit_amount || 0);
    }, 0);

    const upcomingDates = dates.filter((date) => {
      if (!date.start_date || date.closed) return false;
      const ts = new Date(date.start_date).getTime();
      return !Number.isNaN(ts) && ts >= Date.now() - 86400000;
    }).length;

    return {
      activePackages,
      totalPackages: packages.length,
      dates: dates.length,
      upcomingDates,
      bookings: bookings.length,
      totalSpots,
      freeSpots,
      pending,
      depositWaiting,
      confirmed,
      completed,
      rejected,
      cancelled,
      estimatedRevenue,
      confirmedDeposits,
    };
  }, [packages, dates, bookings]);

  const getPackageDates = (packageId) => dates.filter((date) => date.package_id === packageId);

  const recentBookings = useMemo(() => bookings.slice(0, 4), [bookings]);

  const nextDates = useMemo(() => {
    return [...dates]
      .filter((date) => !date.closed)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 5);
  }, [dates]);

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at 50% -10%, rgba(22,245,162,.18), transparent 34%), radial-gradient(circle at 92% 9%, rgba(64,231,255,.12), transparent 30%), linear-gradient(180deg,#010302 0%,#04100c 50%,#06120d 100%)",
      color: "#f4fff9",
      padding: "90px 14px 120px",
      fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    },
    wrap: { maxWidth: 1380, margin: "0 auto" },
    accessCard: {
      maxWidth: 760,
      margin: "80px auto 0",
      padding: 24,
      borderRadius: 34,
      background: "linear-gradient(145deg, rgba(8,24,18,.86), rgba(3,9,7,.98))",
      border: "1px solid rgba(255,80,80,.24)",
      boxShadow: "0 28px 90px rgba(0,0,0,.46)",
    },
    hero: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 42,
      border: "1px solid rgba(125,255,209,.20)",
      background: "linear-gradient(145deg,rgba(8,24,18,.88),rgba(4,10,8,.98))",
      padding: 22,
      marginBottom: 18,
      boxShadow: "0 34px 100px rgba(0,0,0,.34)",
    },
    heroBg: {
      position: "absolute",
      inset: 0,
      opacity: 0.28,
      backgroundImage: `url(${host?.cover_url || FALLBACK})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      filter: "saturate(1.12) contrast(1.07)",
      transform: "scale(1.03)",
    },
    heroOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(90deg, rgba(1,3,2,.98), rgba(1,3,2,.72), rgba(1,3,2,.92)), radial-gradient(circle at 84% 0%, rgba(22,245,162,.20), transparent 34%)",
    },
    heroInner: { position: "relative", zIndex: 2 },
    heroTop: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap",
    },
    identityRow: {
      display: "flex",
      gap: 16,
      alignItems: "flex-start",
      minWidth: 0,
    },
    logo: {
      width: 74,
      height: 74,
      borderRadius: 24,
      objectFit: "cover",
      background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
      border: "1px solid rgba(255,255,255,.18)",
      boxShadow: "0 20px 46px rgba(0,0,0,.34)",
      flex: "0 0 auto",
    },
    badgeRow: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "8px 12px",
      borderRadius: 999,
      background: "rgba(22,245,162,.12)",
      border: "1px solid rgba(125,255,209,.22)",
      color: "#8fffe0",
      fontSize: 11,
      fontWeight: 950,
      letterSpacing: ".12em",
      textTransform: "uppercase",
    },
    verified: {
      display: "inline-flex",
      padding: "8px 12px",
      borderRadius: 999,
      background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
      color: "#03150f",
      fontSize: 11,
      fontWeight: 950,
      letterSpacing: ".10em",
      textTransform: "uppercase",
    },
    title: {
      fontSize: "clamp(42px, 7vw, 82px)",
      fontWeight: 950,
      lineHeight: 0.86,
      letterSpacing: "-.085em",
      marginTop: 14,
      maxWidth: 850,
    },
    subtitle: {
      marginTop: 12,
      color: "rgba(231,255,247,.78)",
      lineHeight: 1.58,
      maxWidth: 700,
      fontWeight: 620,
    },
    contactStrip: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 16,
    },
    contactChip: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "9px 12px",
      borderRadius: 999,
      background: "rgba(255,255,255,.055)",
      border: "1px solid rgba(125,255,209,.14)",
      color: "rgba(231,255,247,.82)",
      fontSize: 12,
      fontWeight: 850,
      textDecoration: "none",
    },
    heroActions: { display: "flex", gap: 10, flexWrap: "wrap" },
    button: {
      border: "none",
      padding: "14px 18px",
      borderRadius: 999,
      background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
      color: "#03150f",
      fontWeight: 950,
      cursor: "pointer",
      whiteSpace: "nowrap",
      boxShadow: "0 20px 48px rgba(22,245,162,.20)",
    },
    ghostButton: {
      border: "1px solid rgba(125,255,209,.22)",
      padding: "13px 17px",
      borderRadius: 999,
      background: "rgba(255,255,255,.06)",
      color: "#f4fff9",
      fontWeight: 900,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    commandPanel: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
      gap: 10,
      marginTop: 22,
    },
    commandCard: {
      border: "1px solid rgba(125,255,209,.13)",
      background: "rgba(255,255,255,.045)",
      borderRadius: 24,
      padding: 15,
      textAlign: "left",
      color: "#f4fff9",
      cursor: "pointer",
    },
    commandTitle: {
      display: "block",
      fontSize: 14,
      fontWeight: 950,
      marginBottom: 5,
    },
    commandText: {
      color: "rgba(231,255,247,.62)",
      fontSize: 12,
      lineHeight: 1.45,
      fontWeight: 650,
    },
    stats: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(138px,1fr))",
      gap: 12,
      marginTop: 18,
    },
    stat: {
      padding: 16,
      borderRadius: 24,
      background: "rgba(255,255,255,.047)",
      border: "1px solid rgba(125,255,209,.13)",
      backdropFilter: "blur(14px)",
    },
    number: { fontSize: 32, fontWeight: 950, letterSpacing: "-.055em" },
    label: {
      marginTop: 6,
      color: "rgba(231,255,247,.60)",
      fontSize: 11,
      fontWeight: 850,
      letterSpacing: ".08em",
      textTransform: "uppercase",
    },
    tabs: {
      display: "flex",
      gap: 9,
      flexWrap: "wrap",
      margin: "18px 0 22px",
      padding: 6,
      borderRadius: 999,
      background: "rgba(255,255,255,.035)",
      border: "1px solid rgba(125,255,209,.10)",
      width: "fit-content",
      maxWidth: "100%",
    },
    tab: (active) => ({
      padding: "12px 16px",
      borderRadius: 999,
      border: active ? "1px solid rgba(125,255,209,.32)" : "1px solid transparent",
      background: active ? "linear-gradient(135deg, rgba(22,245,162,.17), rgba(64,231,255,.12))" : "transparent",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 950,
      textTransform: "capitalize",
    }),
    grid: { display: "grid", gap: 16 },
    twoCol: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
      gap: 16,
    },
    threeCol: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
      gap: 16,
    },
    card: {
      padding: 18,
      borderRadius: 30,
      background: "linear-gradient(145deg, rgba(8,24,18,.76), rgba(3,9,7,.95))",
      border: "1px solid rgba(125,255,209,.13)",
      boxShadow: "0 22px 64px rgba(0,0,0,.22)",
    },
    cardTitle: {
      fontSize: 24,
      fontWeight: 950,
      letterSpacing: "-.045em",
      marginBottom: 12,
    },
    muted: { color: "rgba(231,255,247,.66)", lineHeight: 1.55 },
    packageCard: {
      overflow: "hidden",
      borderRadius: 32,
      background: "linear-gradient(155deg, rgba(9,25,19,.86), rgba(3,9,7,.97))",
      border: "1px solid rgba(125,255,209,.16)",
      boxShadow: "0 26px 74px rgba(0,0,0,.25)",
    },
    packageImageWrap: { position: "relative", height: 230, overflow: "hidden" },
    packageImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      filter: "saturate(1.07) contrast(1.04)",
    },
    imageOverlay: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(to top, rgba(1,3,2,.92), transparent 58%)",
    },
    packageBadge: {
      position: "absolute",
      top: 14,
      left: 14,
      padding: "7px 11px",
      borderRadius: 999,
      background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
      color: "#03150f",
      fontWeight: 950,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: ".08em",
    },
    packageBody: { padding: 17 },
    packageTitle: {
      fontSize: 28,
      lineHeight: 0.98,
      fontWeight: 950,
      letterSpacing: "-.055em",
    },
    packageMeta: { marginTop: 8, color: "#8fffe0", fontWeight: 900, fontSize: 14 },
    description: {
      marginTop: 10,
      color: "rgba(231,255,247,.68)",
      lineHeight: 1.55,
      fontSize: 14,
    },
    depositBox: {
      marginTop: 12,
      padding: 12,
      borderRadius: 18,
      background: "rgba(244,208,111,.09)",
      border: "1px solid rgba(244,208,111,.22)",
      color: "#f7e2a2",
      fontSize: 13,
      lineHeight: 1.5,
      fontWeight: 750,
    },
    chipRow: { display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 },
    chip: {
      padding: "6px 9px",
      borderRadius: 999,
      background: "rgba(255,255,255,.045)",
      border: "1px solid rgba(125,255,209,.12)",
      color: "rgba(231,255,247,.78)",
      fontSize: 12,
      fontWeight: 800,
    },
    row: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      alignItems: "center",
      padding: "13px 14px",
      borderRadius: 18,
      background: "rgba(255,255,255,.045)",
      border: "1px solid rgba(125,255,209,.12)",
    },
    rowStack: { display: "grid", gap: 10 },
    rowTitle: { fontWeight: 900 },
    rowSub: { marginTop: 4, color: "rgba(231,255,247,.60)", fontSize: 13 },
    status: (status) => ({
      display: "inline-flex",
      padding: "7px 10px",
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
    miniActions: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 },
    smallButton: {
      border: "none",
      padding: "10px 12px",
      borderRadius: 999,
      background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
      color: "#03150f",
      fontWeight: 900,
      cursor: "pointer",
      fontSize: 12,
    },
    smallGhost: {
      border: "1px solid rgba(125,255,209,.18)",
      padding: "9px 12px",
      borderRadius: 999,
      background: "rgba(255,255,255,.04)",
      color: "#f4fff9",
      fontWeight: 850,
      cursor: "pointer",
      fontSize: 12,
    },
    dangerGhost: {
      border: "1px solid rgba(255,80,80,.22)",
      padding: "9px 12px",
      borderRadius: 999,
      background: "rgba(255,80,80,.08)",
      color: "#ffd1d1",
      fontWeight: 850,
      cursor: "pointer",
      fontSize: 12,
    },
    empty: {
      padding: 22,
      borderRadius: 26,
      background: "rgba(255,255,255,.035)",
      border: "1px solid rgba(125,255,209,.12)",
      color: "rgba(231,255,247,.66)",
      lineHeight: 1.6,
    },
    bookingCard: {
      padding: 18,
      borderRadius: 30,
      background:
        "radial-gradient(circle at 100% 0%, rgba(22,245,162,.10), transparent 30%), linear-gradient(145deg, rgba(8,24,18,.78), rgba(3,9,7,.96))",
      border: "1px solid rgba(125,255,209,.14)",
      boxShadow: "0 24px 70px rgba(0,0,0,.22)",
    },
    bookingTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: 14,
      flexWrap: "wrap",
      alignItems: "flex-start",
    },
    bookingTitle: {
      fontSize: 26,
      lineHeight: 0.98,
      fontWeight: 950,
      letterSpacing: "-.05em",
    },
    warning: {
      marginTop: 12,
      padding: 13,
      borderRadius: 18,
      background: "rgba(244,208,111,.09)",
      border: "1px solid rgba(244,208,111,.22)",
      color: "#f7e2a2",
      fontSize: 13,
      lineHeight: 1.5,
      fontWeight: 750,
    },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.72)",
      backdropFilter: "blur(16px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    modal: {
      width: "100%",
      maxWidth: 780,
      maxHeight: "90vh",
      overflowY: "auto",
      borderRadius: 34,
      padding: 20,
      background: "linear-gradient(145deg, rgba(8,24,18,.98), rgba(3,9,7,.99))",
      border: "1px solid rgba(125,255,209,.24)",
      boxShadow: "0 34px 100px rgba(0,0,0,.62)",
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      border: "1px solid rgba(125,255,209,.14)",
      background: "rgba(255,255,255,.045)",
      color: "#f4fff9",
      borderRadius: 18,
      padding: "14px",
      outline: "none",
      fontSize: 14,
    },
    textarea: {
      width: "100%",
      boxSizing: "border-box",
      minHeight: 110,
      border: "1px solid rgba(125,255,209,.14)",
      background: "rgba(255,255,255,.045)",
      color: "#f4fff9",
      borderRadius: 18,
      padding: "14px",
      outline: "none",
      resize: "vertical",
      fontFamily: "inherit",
      fontSize: 14,
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
      gap: 12,
    },
    switchCard: {
      padding: 14,
      borderRadius: 22,
      background: "rgba(255,255,255,.04)",
      border: "1px solid rgba(125,255,209,.13)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      cursor: "pointer",
    },
    galleryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
      gap: 10,
    },
    galleryItem: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 18,
      border: "1px solid rgba(125,255,209,.14)",
      background: "rgba(255,255,255,.04)",
      height: 120,
    },
    galleryImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },
    removePhoto: {
      position: "absolute",
      right: 8,
      top: 8,
      border: "none",
      width: 28,
      height: 28,
      borderRadius: 999,
      background: "rgba(0,0,0,.62)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 900,
    },
    fileBox: {
      padding: 14,
      borderRadius: 20,
      background: "rgba(255,255,255,.04)",
      border: "1px dashed rgba(125,255,209,.24)",
      color: "rgba(231,255,247,.72)",
    },
  };

  if (loading) return <div style={styles.page}>Loading dashboard...</div>;

  if (accessDenied) {
    return (
      <main style={styles.page}>
        <div style={styles.accessCard}>
          <div style={styles.badge}>Protected dashboard</div>
          <div style={{ ...styles.title, fontSize: "clamp(38px,6vw,68px)" }}>
            Access denied.
          </div>
          <div style={styles.subtitle}>
            This dashboard belongs to another host account. Log in with the owner account
            for this Experience Host profile.
          </div>

          <div style={styles.heroActions}>
            <button style={styles.button} onClick={() => navigate("/login")}>
              Go to login
            </button>

            {host?.slug ? (
              <button style={styles.ghostButton} onClick={() => navigate(`/host/${host.slug}`)}>
                Open public profile
              </button>
            ) : null}
          </div>
        </div>
      </main>
    );
  }

  if (!host) return <div style={styles.page}>Host not found.</div>;

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.hero}>
          <div style={styles.heroBg} />
          <div style={styles.heroOverlay} />

          <div style={styles.heroInner}>
            <div style={styles.heroTop}>
              <div style={styles.identityRow}>
                <img src={host.logo_url || host.cover_url || FALLBACK} alt="" style={styles.logo} />

                <div>
                  <div style={styles.badgeRow}>
                    <div style={styles.badge}>Host Command Center</div>
                    <div style={host.verified ? styles.verified : styles.badge}>
                      {host.verified ? "Verified" : "Pending verification"}
                    </div>
                  </div>

                  <div style={styles.title}>{host?.name}</div>

                  <div style={styles.subtitle}>
                    {host?.location || "No location added yet"}
                    {host?.category ? ` • ${host.category}` : ""}
                    <br />
                    {host?.short_description ||
                      "Manage packages, dates, deposits and reservations from one place."}
                  </div>

                  <div style={styles.contactStrip}>
                    {host.email ? (
                      <a style={styles.contactChip} href={`mailto:${host.email}`}>
                        ✉ {host.email}
                      </a>
                    ) : null}

                    {host.phone ? (
                      <a style={styles.contactChip} href={`tel:${normalizePhone(host.phone)}`}>
                        ☎ {host.phone}
                      </a>
                    ) : null}

                    {host.instagram ? (
                      <span style={styles.contactChip}>◎ {host.instagram}</span>
                    ) : null}

                    {host.address ? (
                      <span style={styles.contactChip}>📍 {host.address}</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div style={styles.heroActions}>
                <button
                  style={styles.button}
                  onClick={() => navigate(`/host-dashboard/${id}/create-package`)}
                >
                  + Create package
                </button>

                <button style={styles.ghostButton} onClick={() => setTab("bookings")}>
                  Reservations
                </button>

                <button style={styles.ghostButton} onClick={() => navigate(`/host/${host.slug}`)}>
                  Public profile
                </button>

                {host?.map_url ? (
                  <button style={styles.ghostButton} onClick={() => window.open(host.map_url, "_blank")}>
                    Map
                  </button>
                ) : null}
              </div>
            </div>

            <div style={styles.stats}>
              <div style={styles.stat}>
                <div style={styles.number}>{stats.activePackages}</div>
                <div style={styles.label}>Active packages</div>
              </div>

              <div style={styles.stat}>
                <div style={styles.number}>{stats.bookings}</div>
                <div style={styles.label}>Reservations</div>
              </div>

              <div style={styles.stat}>
                <div style={styles.number}>{stats.estimatedRevenue}</div>
                <div style={styles.label}>Est. revenue</div>
              </div>

              <div style={styles.stat}>
                <div style={styles.number}>{stats.upcomingDates}</div>
                <div style={styles.label}>Upcoming dates</div>
              </div>

              <div style={styles.stat}>
                <div style={styles.number}>{stats.freeSpots}</div>
                <div style={styles.label}>Free spots</div>
              </div>

              <div style={styles.stat}>
                <div style={styles.number}>{stats.depositWaiting}</div>
                <div style={styles.label}>Deposit waiting</div>
              </div>

              <div style={styles.stat}>
                <div style={styles.number}>{stats.confirmed}</div>
                <div style={styles.label}>Confirmed</div>
              </div>

              <div style={styles.stat}>
                <div style={styles.number}>{stats.completed}</div>
                <div style={styles.label}>Completed</div>
              </div>
            </div>

            <div style={styles.commandPanel}>
              <button style={styles.commandCard} onClick={() => navigate(`/host-dashboard/${id}/create-package`)}>
                <span style={styles.commandTitle}>Create package</span>
                <span style={styles.commandText}>Add photos, price, deposit, dates and spots.</span>
              </button>

              <button style={styles.commandCard} onClick={() => setTab("packages")}>
                <span style={styles.commandTitle}>Manage packages</span>
                <span style={styles.commandText}>Edit package details, gallery and deposit rules.</span>
              </button>

              <button style={styles.commandCard} onClick={() => setTab("dates")}>
                <span style={styles.commandTitle}>Calendar</span>
                <span style={styles.commandText}>See upcoming dates and available spots.</span>
              </button>

              <button style={styles.commandCard} onClick={() => setTab("bookings")}>
                <span style={styles.commandTitle}>Reservations</span>
                <span style={styles.commandText}>Confirm deposits, reject, complete or contact guests.</span>
              </button>
            </div>
          </div>
        </div>

        <div style={styles.tabs}>
          {["overview", "packages", "dates", "bookings", "profile"].map((x) => (
            <button key={x} style={styles.tab(tab === x)} onClick={() => setTab(x)}>
              {x}
            </button>
          ))}
        </div>

        <div style={styles.grid}>
          {tab === "overview" && (
            <>
              <div style={styles.threeCol}>
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Next dates</div>

                  <div style={styles.rowStack}>
                    {nextDates.length ? (
                      nextDates.map((date) => {
                        const pkg = packages.find((p) => p.id === date.package_id);
                        return (
                          <div key={date.id} style={styles.row}>
                            <div>
                              <div style={styles.rowTitle}>{pkg?.title || "Package"}</div>
                              <div style={styles.rowSub}>{formatDateRange(date.start_date, date.end_date)}</div>
                            </div>
                            <div style={styles.status(date.free_spots <= 0 ? "deposit_waiting" : "confirmed")}>
                              {date.free_spots}/{date.total_spots}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={styles.empty}>No upcoming dates yet.</div>
                    )}
                  </div>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardTitle}>Latest reservations</div>

                  <div style={styles.rowStack}>
                    {recentBookings.length ? (
                      recentBookings.map((booking) => (
                        <div key={booking.id} style={styles.row}>
                          <div>
                            <div style={styles.rowTitle}>{booking.full_name || "MeetOutdoors user"}</div>
                            <div style={styles.rowSub}>
                              {booking.experience_packages?.title || "Package"} • {booking.persons || 1} persons
                            </div>
                          </div>
                          <div style={styles.status(booking.status)}>{statusLabel(booking.status)}</div>
                        </div>
                      ))
                    ) : (
                      <div style={styles.empty}>No reservations yet.</div>
                    )}
                  </div>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardTitle}>Deposit workflow</div>
                  <div style={styles.muted}>
                    When a package requires a deposit, the user sees instructions before booking.
                    Confirm the reservation only after you verify payment manually.
                  </div>

                  <div style={styles.warning}>
                    Current system is manual deposit confirmation. No online payment is processed here.
                  </div>

                  <div style={styles.miniActions}>
                    <button style={styles.smallButton} onClick={() => setTab("bookings")}>
                      Open reservations
                    </button>
                    <button style={styles.smallGhost} onClick={() => setTab("profile")}>
                      Payment instructions
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "packages" && (
            <>
              <div style={styles.heroActions}>
                <button style={styles.button} onClick={() => navigate(`/host-dashboard/${id}/create-package`)}>
                  + Add new package
                </button>
              </div>

              {packages.length ? (
                <div style={styles.twoCol}>
                  {packages.map((pkg) => {
                    const pkgDates = getPackageDates(pkg.id);
                    const galleryCount = Array.isArray(pkg.gallery_urls) ? pkg.gallery_urls.length : 0;

                    return (
                      <div key={pkg.id} style={styles.packageCard}>
                        <div style={styles.packageImageWrap}>
                          <img src={pkg.cover_url || host.cover_url || FALLBACK} alt={pkg.title} style={styles.packageImage} />
                          <div style={styles.imageOverlay} />
                          <div style={styles.packageBadge}>{pkg.active ? "Active" : "Inactive"}</div>
                        </div>

                        <div style={styles.packageBody}>
                          <div style={styles.packageTitle}>{pkg.title}</div>

                          <div style={styles.packageMeta}>
                            {pkg.price ? `${pkg.price} ${pkg.currency || "EUR"}` : "Price on request"}
                            {pkg.duration ? ` • ${pkg.duration}` : ""}
                          </div>

                          {pkg.deposit_required ? (
                            <div style={styles.depositBox}>
                              Deposit required: {pkg.deposit_amount || 0} {pkg.currency || "EUR"}
                              <br />
                              {pkg.deposit_instructions || host.payment_instructions || "No deposit instructions added."}
                            </div>
                          ) : (
                            <div style={styles.depositBox}>No deposit required.</div>
                          )}

                          {pkg.description ? <div style={styles.description}>{pkg.description}</div> : null}

                          {pkg.included?.length ? (
                            <div style={styles.chipRow}>
                              {pkg.included.slice(0, 8).map((item) => (
                                <span key={item} style={styles.chip}>✓ {item}</span>
                              ))}
                            </div>
                          ) : null}

                          <div style={styles.chipRow}>
                            <span style={styles.chip}>{pkgDates.length} dates</span>
                            <span style={styles.chip}>{galleryCount} gallery photos</span>
                          </div>

                          <div style={styles.miniActions}>
                            <button
                              style={styles.smallButton}
                              onClick={() => navigate(`/host-dashboard/${id}/package/${pkg.id}/create-date`)}
                            >
                              Add date
                            </button>

                            <button style={styles.smallGhost} onClick={() => openEditPackage(pkg)}>
                              Edit
                            </button>

                            <button style={styles.dangerGhost} onClick={() => deletePackage(pkg)}>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.empty}>
                  No packages yet. Create your first package with image, price, deposit settings and gallery.
                </div>
              )}
            </>
          )}

          {tab === "dates" && (
            <>
              {packages.length ? (
                <div style={styles.grid}>
                  {packages.map((pkg) => {
                    const pkgDates = getPackageDates(pkg.id);

                    return (
                      <div key={pkg.id} style={styles.card}>
                        <div style={styles.heroTop}>
                          <div>
                            <div style={styles.cardTitle}>{pkg.title}</div>
                            <div style={styles.muted}>
                              {pkgDates.length} available date{pkgDates.length === 1 ? "" : "s"}
                            </div>
                          </div>

                          <button
                            style={styles.smallButton}
                            onClick={() => navigate(`/host-dashboard/${id}/package/${pkg.id}/create-date`)}
                          >
                            Add date
                          </button>
                        </div>

                        <div style={{ ...styles.rowStack, marginTop: 14 }}>
                          {pkgDates.length ? (
                            pkgDates.map((date) => {
                              const full = date.free_spots <= 0;
                              const closed = date.closed;

                              return (
                                <div key={date.id} style={styles.row}>
                                  <div>
                                    <div style={styles.rowTitle}>
                                      {formatDateRange(date.start_date, date.end_date)}
                                    </div>
                                    <div style={styles.rowSub}>
                                      {date.free_spots}/{date.total_spots} free spots
                                      {date.price_override ? ` • ${date.price_override} EUR` : ""}
                                    </div>
                                  </div>

                                  <div style={styles.status(closed ? "cancelled" : full ? "deposit_waiting" : "confirmed")}>
                                    {closed ? "Closed" : full ? "Full" : "Open"}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div style={styles.empty}>No dates for this package yet.</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.empty}>Create a package first, then add dates.</div>
              )}
            </>
          )}

          {tab === "bookings" && (
            <>
              {bookings.length ? (
                <div style={styles.grid}>
                  {bookings.map((booking) => {
                    const pkg = booking.experience_packages;
                    const requiresDeposit = pkg?.deposit_required;
                    const phone = booking.phone || booking.customer_phone;
                    const cleanPhone = normalizePhone(phone);

                    return (
                      <div key={booking.id} style={styles.bookingCard}>
                        <div style={styles.bookingTop}>
                          <div>
                            <div style={styles.bookingTitle}>{booking.full_name || "MeetOutdoors user"}</div>
                            <div style={styles.muted}>
                              {pkg?.title || "Package"} •{" "}
                              {formatDateRange(booking.experience_dates?.start_date, booking.experience_dates?.end_date)}
                            </div>
                          </div>

                          <div style={styles.status(booking.status)}>{statusLabel(booking.status)}</div>
                        </div>

                        {requiresDeposit ? (
                          <div style={styles.warning}>
                            Deposit required: {pkg.deposit_amount || booking.deposit_amount || 0} {pkg.currency || "EUR"}
                            <br />
                            Confirm only after deposit verification.
                            <br />
                            Instructions: {pkg.deposit_instructions || host.payment_instructions || "No instructions added."}
                          </div>
                        ) : (
                          <div style={styles.warning}>
                            No deposit required. You can manually confirm this reservation.
                          </div>
                        )}

                        <div style={{ ...styles.rowStack, marginTop: 12 }}>
                          <div style={styles.row}><span>Persons</span><strong>{booking.persons}</strong></div>

                          {booking.email ? <div style={styles.row}><span>Email</span><strong>{booking.email}</strong></div> : null}
                          {phone ? <div style={styles.row}><span>Phone</span><strong>{phone}</strong></div> : null}
                          {booking.note ? <div style={styles.row}><span>Note</span><strong>{booking.note}</strong></div> : null}
                        </div>

                        <div style={styles.miniActions}>
                          <button style={styles.smallButton} onClick={() => updateBookingStatus(booking.id, "confirmed")}>
                            {requiresDeposit ? "Confirm deposit" : "Confirm"}
                          </button>

                          <button style={styles.smallButton} onClick={() => updateBookingStatus(booking.id, "completed")}>
                            Complete
                          </button>

                          <button style={styles.dangerGhost} onClick={() => updateBookingStatus(booking.id, "rejected")}>
                            Reject
                          </button>

                          <button style={styles.smallGhost} onClick={() => updateBookingStatus(booking.id, "cancelled")}>
                            Cancel
                          </button>

                          {booking.email ? (
                            <button
                              style={styles.smallGhost}
                              onClick={() =>
                                (window.location.href = `mailto:${booking.email}?subject=MeetOutdoors reservation - ${pkg?.title || "Experience"}`)
                              }
                            >
                              Email
                            </button>
                          ) : null}

                          {cleanPhone ? (
                            <button style={styles.smallGhost} onClick={() => window.open(`https://wa.me/${cleanPhone}`, "_blank")}>
                              WhatsApp
                            </button>
                          ) : null}

                          {cleanPhone ? (
                            <button style={styles.smallGhost} onClick={() => (window.location.href = `tel:${cleanPhone}`)}>
                              Call
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.empty}>No reservations yet.</div>
              )}
            </>
          )}

          {tab === "profile" && (
            <div style={styles.twoCol}>
              <div style={styles.card}>
                <div style={styles.cardTitle}>Host details</div>

                <div style={styles.rowStack}>
                  <div style={styles.row}><span>Name</span><strong>{host.name}</strong></div>
                  <div style={styles.row}><span>Slug</span><strong>/host/{host.slug}</strong></div>
                  <div style={styles.row}><span>Category</span><strong>{host.category || "Not set"}</strong></div>
                  <div style={styles.row}><span>Location</span><strong>{host.location || "Not set"}</strong></div>
                  <div style={styles.row}><span>Address</span><strong>{host.address || "Not set"}</strong></div>
                  <div style={styles.row}><span>Phone</span><strong>{host.phone || "Not set"}</strong></div>
                  <div style={styles.row}><span>Email</span><strong>{host.email || "Not set"}</strong></div>
                  <div style={styles.row}><span>Instagram</span><strong>{host.instagram || "Not set"}</strong></div>
                  <div style={styles.row}><span>WhatsApp</span><strong>{host.whatsapp || "Not set"}</strong></div>
                  <div style={styles.row}><span>Website</span><strong>{host.website || "Not set"}</strong></div>
                  <div style={styles.row}><span>Verified</span><strong>{host.verified ? "Yes" : "No"}</strong></div>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>Description & payment</div>

                <div style={styles.muted}>{host.description || host.short_description || "No description yet."}</div>

                <div style={styles.warning}>
                  Payment instructions:
                  <br />
                  {host.payment_instructions || "No payment instructions added."}
                </div>

                <div style={styles.miniActions}>
                  <button style={styles.smallButton} onClick={() => navigate(`/host/${host.slug}`)}>
                    Open public page
                  </button>

                  {host.map_url ? (
                    <button style={styles.smallGhost} onClick={() => window.open(host.map_url, "_blank")}>
                      Open map
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {editingPackage && editForm ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.heroTop}>
              <div>
                <div style={styles.badge}>Edit package</div>
                <div style={{ ...styles.cardTitle, marginTop: 12 }}>{editingPackage.title}</div>
              </div>

              <button
                style={styles.smallGhost}
                onClick={() => {
                  setEditingPackage(null);
                  setEditForm(null);
                  setPackageError("");
                }}
              >
                Close
              </button>
            </div>

            <div style={{ ...styles.grid, marginTop: 16 }}>
              <div style={styles.formGrid}>
                <input style={styles.input} placeholder="Package title" value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} />
                <input style={styles.input} placeholder="Duration" value={editForm.duration} onChange={(e) => setEditForm((p) => ({ ...p, duration: e.target.value }))} />
                <input style={styles.input} placeholder="Price" type="number" value={editForm.price} onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))} />
                <input style={styles.input} placeholder="Currency" value={editForm.currency} onChange={(e) => setEditForm((p) => ({ ...p, currency: e.target.value }))} />
              </div>

              <textarea style={styles.textarea} placeholder="Description" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />

              <div style={styles.formGrid}>
                <input style={styles.input} placeholder="Included: Rafting, Guide, Lunch" value={editForm.included} onChange={(e) => setEditForm((p) => ({ ...p, included: e.target.value }))} />
                <input style={styles.input} placeholder="Not included" value={editForm.not_included} onChange={(e) => setEditForm((p) => ({ ...p, not_included: e.target.value }))} />
              </div>

              <div style={styles.switchCard} onClick={() => setEditForm((p) => ({ ...p, active: !p.active }))}>
                <div>
                  <strong>Package active</strong>
                  <div style={styles.muted}>Inactive packages are hidden from users.</div>
                </div>
                <strong>{editForm.active ? "ON" : "OFF"}</strong>
              </div>

              <div style={styles.switchCard} onClick={() => setEditForm((p) => ({ ...p, deposit_required: !p.deposit_required }))}>
                <div>
                  <strong>Require deposit</strong>
                  <div style={styles.muted}>Users will see deposit amount and instructions before booking.</div>
                </div>
                <strong>{editForm.deposit_required ? "ON" : "OFF"}</strong>
              </div>

              {editForm.deposit_required ? (
                <>
                  <div style={styles.formGrid}>
                    <input style={styles.input} placeholder="Deposit amount" type="number" value={editForm.deposit_amount} onChange={(e) => setEditForm((p) => ({ ...p, deposit_amount: e.target.value }))} />
                    <input style={styles.input} placeholder="Currency" value={editForm.currency} onChange={(e) => setEditForm((p) => ({ ...p, currency: e.target.value }))} />
                  </div>

                  <textarea style={styles.textarea} placeholder="Deposit instructions" value={editForm.deposit_instructions} onChange={(e) => setEditForm((p) => ({ ...p, deposit_instructions: e.target.value }))} />
                </>
              ) : null}

              <div style={styles.card}>
                <div style={styles.cardTitle}>Cover image</div>

                {editForm.cover_url ? (
                  <div style={{ ...styles.galleryItem, height: 190, marginBottom: 12 }}>
                    <img src={editForm.cover_url} alt="Cover" style={styles.galleryImage} />
                  </div>
                ) : null}

                <div style={styles.fileBox}>
                  <input type="file" accept="image/*" onChange={(e) => handleCoverUpload(e.target.files?.[0])} />
                  <div style={{ marginTop: 8 }}>{uploading ? "Uploading..." : "Upload cover from gallery"}</div>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>Gallery photos</div>

                <div style={styles.fileBox}>
                  <input type="file" multiple accept="image/*" onChange={(e) => handleGalleryUpload(e.target.files)} />
                  <div style={{ marginTop: 8 }}>{uploading ? "Uploading..." : "Upload multiple photos from gallery"}</div>
                </div>

                {editForm.gallery_urls?.length ? (
                  <div style={{ ...styles.galleryGrid, marginTop: 14 }}>
                    {editForm.gallery_urls.map((img, index) => (
                      <div key={`${img}-${index}`} style={styles.galleryItem}>
                        <img src={img} alt="" style={styles.galleryImage} />
                        <button type="button" style={styles.removePhoto} onClick={() => removeGalleryImage(index)}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ ...styles.muted, marginTop: 12 }}>No gallery photos yet.</div>
                )}
              </div>

              {packageError ? <div style={styles.warning}>{packageError}</div> : null}

              <div style={styles.miniActions}>
                <button style={styles.smallButton} onClick={savePackageEdit} disabled={savingPackage || uploading}>
                  {savingPackage ? "Saving..." : "Save package"}
                </button>

                <button
                  style={styles.smallGhost}
                  onClick={() => {
                    setEditingPackage(null);
                    setEditForm(null);
                    setPackageError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
