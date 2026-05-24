import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useParams } from "react-router-dom";

const FALLBACK =
  "https://images.pexels.com/photos/1732278/pexels-photo-1732278.jpeg";

function formatDateRange(start, end) {
  if (!start) return "Date soon";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  if (Number.isNaN(startDate.getTime())) return start;

  const startLabel = startDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  if (!endDate || Number.isNaN(endDate.getTime())) return startLabel;

  const endLabel = endDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return `${startLabel} - ${endLabel}`;
}

function getMonthLabel(start) {
  if (!start) return "Available";
  const date = new Date(start);
  if (Number.isNaN(date.getTime())) return "Available";

  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export default function HostProfile() {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState(null);
  const [hostInactive, setHostInactive] = useState(false);
  const [packages, setPackages] = useState([]);
  const [dates, setDates] = useState([]);
  const [galleryOpen, setGalleryOpen] = useState(null);

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const [fullName, setFullName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [persons, setPersons] = useState(1);
  const [note, setNote] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function load() {
    setLoading(true);

    const { data: hostData } = await supabase
      .from("experience_hosts")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!hostData) {
      setHost(null);
      setHostInactive(false);
      setLoading(false);
      return;
    }

    if (hostData.active === false) {
      setHost(hostData);
      setHostInactive(true);
      setPackages([]);
      setDates([]);
      setLoading(false);
      return;
    }

    setHostInactive(false);

    const { data: packageData } = await supabase
      .from("experience_packages")
      .select("*")
      .eq("host_id", hostData.id)
      .eq("active", true)
      .order("created_at", { ascending: false });

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
    setDates(dateData);
    setLoading(false);
  }

  function openReservation(pkg, date) {
    const unavailable = date.free_spots <= 0 || date.closed;
    if (unavailable) return;

    setSelectedPackage(pkg);
    setSelectedDate(date);
    setPersons(1);
    setNote("");
    setFullName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setBookingMessage("");
    setBookingSuccess(false);
  }

  async function reserveDate() {
    if (!selectedDate || !selectedPackage) return;

    setBookingMessage("");
    setBookingSuccess(false);

    if (!fullName.trim()) {
      setBookingMessage("Full name is required.");
      return;
    }

    if (!customerEmail.trim()) {
      setBookingMessage("Email is required.");
      return;
    }

    if (!customerPhone.trim()) {
      setBookingMessage("Phone is required.");
      return;
    }

    setBookingLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      setBookingLoading(false);
      setBookingMessage("You must be logged in to reserve.");
      return;
    }

    const targetStatus = selectedPackage.deposit_required ? "deposit_waiting" : "pending";

    const depositLine = selectedPackage.deposit_required
      ? `Deposit required: ${selectedPackage.deposit_amount || 0} ${
          selectedPackage.currency || "EUR"
        }`
      : "No deposit required";

    const finalNote = [depositLine, note ? `Guest note: ${note}` : ""]
      .filter(Boolean)
      .join("\n");

    const { error: rpcError } = await supabase.rpc("create_experience_booking", {
      p_date_id: selectedDate.id,
      p_persons: persons,
      p_note: finalNote || null,
    });

    if (rpcError) {
      setBookingLoading(false);
      setBookingMessage(rpcError.message);
      return;
    }

    const { data: latestBooking } = await supabase
      .from("experience_bookings")
      .select("id")
      .eq("date_id", selectedDate.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestBooking?.id) {
      await supabase
        .from("experience_bookings")
        .update({
          full_name: fullName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone.trim(),
          customer_phone: customerPhone.trim(),
          status: targetStatus,
          deposit_amount: selectedPackage.deposit_required
            ? Number(selectedPackage.deposit_amount || 0)
            : 0,
        })
        .eq("id", latestBooking.id);
    }

    setBookingLoading(false);
    setBookingSuccess(true);
    setBookingMessage(
      selectedPackage.deposit_required
        ? "Reservation request sent. Status: deposit waiting. Your spot is not confirmed until the host verifies the deposit."
        : "Reservation request sent. The host can confirm it from their dashboard."
    );

    await load();

    setTimeout(() => {
      setSelectedDate(null);
      setSelectedPackage(null);
      setPersons(1);
      setNote("");
      setFullName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setBookingMessage("");
      setBookingSuccess(false);
    }, 1900);
  }

  const packageStats = useMemo(() => {
    const totalDates = dates.length;
    const freeSpots = dates.reduce((sum, item) => sum + (item.free_spots || 0), 0);
    return { totalDates, freeSpots };
  }, [dates]);

  const firstAvailableDate = useMemo(() => {
    return dates.find((item) => !item.closed && item.free_spots > 0) || null;
  }, [dates]);

  const firstAvailablePackage = useMemo(() => {
    if (!firstAvailableDate) return null;
    return packages.find((item) => item.id === firstAvailableDate.package_id) || null;
  }, [firstAvailableDate, packages]);

  const styles = useMemo(
    () => ({
      page: {
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% -10%, rgba(22,245,162,.16), transparent 34%), radial-gradient(circle at 90% 8%, rgba(64,231,255,.10), transparent 28%), linear-gradient(180deg,#010302 0%,#04100c 46%,#071611 100%)",
        color: "#f4fff9",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflowX: "hidden",
      },
      loadingPage: {
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg,#010302,#06120d)",
        color: "#f4fff9",
        fontWeight: 900,
      },

      unavailableCard: {
        maxWidth: 720,
        margin: "0 auto",
        padding: 26,
        borderRadius: 34,
        background:
          "linear-gradient(145deg, rgba(8,24,18,.82), rgba(3,9,7,.96))",
        border: "1px solid rgba(255,80,80,.24)",
        boxShadow: "0 30px 90px rgba(0,0,0,.38)",
        textAlign: "center",
      },
      hero: {
        position: "relative",
        minHeight: "92vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
      },
      heroImage: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: "saturate(1.08) contrast(1.08) brightness(.86)",
        transform: "scale(1.02)",
      },
      heroOverlay: {
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(circle at 42% 26%, rgba(22,245,162,.16), transparent 26%), linear-gradient(to top, rgba(1,3,2,1) 0%, rgba(1,3,2,.86) 22%, rgba(1,3,2,.36) 60%, rgba(1,3,2,.12) 100%), linear-gradient(90deg, rgba(1,3,2,.82), rgba(1,3,2,.12))",
      },
      heroGrid: {
        position: "absolute",
        inset: 0,
        opacity: 0.34,
        background:
          "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",
        backgroundSize: "46px 46px",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 34%, transparent 86%)",
      },
      heroInner: {
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: 1320,
        margin: "0 auto",
        padding: "150px 16px 42px",
      },
      heroLayout: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 410px)",
        gap: 22,
        alignItems: "end",
      },
      badgeRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 9,
        alignItems: "center",
        marginBottom: 18,
      },
      badge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 14px",
        borderRadius: 999,
        background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
        color: "#03150f",
        fontWeight: 950,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: ".12em",
      },
      glassBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,.07)",
        border: "1px solid rgba(125,255,209,.18)",
        color: "#8fffe0",
        fontWeight: 900,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: ".12em",
        backdropFilter: "blur(14px)",
      },
      title: {
        margin: 0,
        fontSize: "clamp(52px,8.4vw,112px)",
        lineHeight: 0.84,
        fontWeight: 950,
        letterSpacing: "-.09em",
        maxWidth: 900,
        textShadow: "0 28px 80px rgba(0,0,0,.46)",
      },
      subtitle: {
        marginTop: 18,
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        alignItems: "center",
        color: "rgba(231,255,247,.86)",
        fontSize: 15,
        fontWeight: 800,
      },
      dot: {
        width: 5,
        height: 5,
        borderRadius: 999,
        background: "rgba(231,255,247,.50)",
      },
      heroDescription: {
        marginTop: 18,
        maxWidth: 660,
        color: "rgba(231,255,247,.76)",
        lineHeight: 1.68,
        fontSize: 16,
        fontWeight: 620,
      },
      heroActions: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginTop: 24,
      },
      primaryButton: {
        border: "none",
        borderRadius: 999,
        padding: "15px 19px",
        background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
        color: "#03150f",
        fontWeight: 950,
        cursor: "pointer",
        boxShadow: "0 22px 52px rgba(22,245,162,.22)",
      },
      ghostButton: {
        border: "1px solid rgba(125,255,209,.22)",
        borderRadius: 999,
        padding: "14px 18px",
        background: "rgba(255,255,255,.06)",
        color: "#f4fff9",
        fontWeight: 900,
        cursor: "pointer",
        backdropFilter: "blur(14px)",
      },
      bookingPanel: {
        borderRadius: 34,
        padding: 18,
        background:
          "linear-gradient(145deg, rgba(8,24,18,.82), rgba(3,9,7,.96))",
        border: "1px solid rgba(125,255,209,.20)",
        boxShadow: "0 30px 90px rgba(0,0,0,.44)",
        backdropFilter: "blur(20px)",
      },
      panelTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 14,
      },
      panelEyebrow: {
        color: "#8fffe0",
        fontSize: 11,
        fontWeight: 950,
        letterSpacing: ".15em",
        textTransform: "uppercase",
        marginBottom: 7,
      },
      panelTitle: {
        fontSize: 28,
        lineHeight: 0.96,
        fontWeight: 950,
        letterSpacing: "-.055em",
      },
      panelPrice: {
        color: "#8fffe0",
        fontSize: 15,
        fontWeight: 950,
        whiteSpace: "nowrap",
      },
      panelStats: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
        marginTop: 16,
      },
      panelStat: {
        padding: "12px 10px",
        borderRadius: 18,
        background: "rgba(255,255,255,.045)",
        border: "1px solid rgba(125,255,209,.12)",
      },
      panelStatNumber: {
        display: "block",
        fontSize: 20,
        fontWeight: 950,
        letterSpacing: "-.04em",
      },
      panelStatLabel: {
        display: "block",
        marginTop: 3,
        color: "rgba(231,255,247,.56)",
        fontSize: 10,
        fontWeight: 850,
        textTransform: "uppercase",
        letterSpacing: ".10em",
      },
      section: {
        maxWidth: 1320,
        margin: "0 auto",
        padding: "44px 16px 0",
      },
      sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 16,
        marginBottom: 18,
      },
      sectionEyebrow: {
        color: "#8fffe0",
        fontSize: 11,
        fontWeight: 950,
        letterSpacing: ".16em",
        textTransform: "uppercase",
        marginBottom: 8,
      },
      sectionTitle: {
        margin: 0,
        fontSize: "clamp(34px,6vw,54px)",
        lineHeight: 0.95,
        fontWeight: 950,
        letterSpacing: "-.07em",
      },
      sectionSubtitle: {
        marginTop: 9,
        maxWidth: 680,
        color: "rgba(231,255,247,.68)",
        lineHeight: 1.6,
        fontSize: 14,
      },
      aboutGrid: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.2fr) minmax(300px, .8fr)",
        gap: 18,
      },
      about: {
        padding: 24,
        borderRadius: 32,
        background:
          "linear-gradient(145deg, rgba(8,24,18,.74), rgba(3,9,7,.94))",
        border: "1px solid rgba(125,255,209,.14)",
        color: "rgba(231,255,247,.76)",
        lineHeight: 1.75,
        boxShadow: "0 22px 60px rgba(0,0,0,.20)",
      },
      trustCard: {
        padding: 24,
        borderRadius: 32,
        background:
          "radial-gradient(circle at 100% 0%, rgba(22,245,162,.16), transparent 32%), linear-gradient(145deg, rgba(8,24,18,.74), rgba(3,9,7,.94))",
        border: "1px solid rgba(125,255,209,.14)",
        boxShadow: "0 22px 60px rgba(0,0,0,.20)",
      },
      trustRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "13px 0",
        borderBottom: "1px solid rgba(125,255,209,.10)",
        color: "rgba(231,255,247,.72)",
      },
      trustValue: {
        color: "#f4fff9",
        fontWeight: 950,
      },
      contactGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
        gap: 12,
        marginTop: 18,
      },
      contactCard: {
        padding: 16,
        borderRadius: 24,
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(125,255,209,.12)",
      },
      contactLabel: {
        color: "rgba(231,255,247,.55)",
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        marginBottom: 6,
      },
      contactValue: {
        color: "#f4fff9",
        fontWeight: 850,
        overflowWrap: "anywhere",
      },
      packageGrid: {
        display: "grid",
        gap: 22,
      },
      packageCard: {
        overflow: "hidden",
        borderRadius: 36,
        background:
          "linear-gradient(155deg, rgba(9,25,19,.86), rgba(3,9,7,.97))",
        border: "1px solid rgba(125,255,209,.17)",
        boxShadow: "0 30px 90px rgba(0,0,0,.28)",
      },
      packageTop: {
        display: "grid",
        gridTemplateColumns: "minmax(280px, .9fr) minmax(0, 1.1fr)",
        minHeight: 330,
      },
      coverWrap: {
        position: "relative",
        minHeight: 320,
        overflow: "hidden",
      },
      cover: {
        position: "absolute",
        inset: 0,
        height: "100%",
        width: "100%",
        objectFit: "cover",
        filter: "saturate(1.08) contrast(1.04)",
      },
      coverOverlay: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to top, rgba(1,3,2,.88), rgba(1,3,2,.08) 60%)",
      },
      coverBadge: {
        position: "absolute",
        left: 16,
        top: 16,
        padding: "8px 12px",
        borderRadius: 999,
        background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
        color: "#03150f",
        fontSize: 11,
        fontWeight: 950,
        textTransform: "uppercase",
        letterSpacing: ".09em",
      },
      coverBottom: {
        position: "absolute",
        left: 18,
        right: 18,
        bottom: 18,
      },
      packageBody: {
        padding: 22,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      },
      packageTitle: {
        fontSize: "clamp(32px,4.8vw,50px)",
        fontWeight: 950,
        lineHeight: 0.92,
        letterSpacing: "-.075em",
        margin: 0,
      },
      packageDescription: {
        marginTop: 13,
        color: "rgba(231,255,247,.70)",
        fontSize: 14,
        lineHeight: 1.65,
      },
      price: {
        marginTop: 14,
        color: "#8fffe0",
        fontWeight: 950,
        fontSize: 16,
      },
      depositBox: {
        marginTop: 14,
        padding: 14,
        borderRadius: 22,
        background: "rgba(244,208,111,.09)",
        border: "1px solid rgba(244,208,111,.22)",
        color: "#f7e2a2",
        fontSize: 13,
        lineHeight: 1.5,
        fontWeight: 750,
      },
      included: {
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 15,
      },
      chip: {
        padding: "7px 10px",
        borderRadius: 999,
        background: "rgba(255,255,255,.045)",
        border: "1px solid rgba(125,255,209,.12)",
        color: "rgba(231,255,247,.78)",
        fontSize: 12,
        fontWeight: 800,
      },
      dateBlock: {
        marginTop: 20,
        padding: 16,
        borderRadius: 26,
        background: "rgba(255,255,255,.035)",
        border: "1px solid rgba(125,255,209,.11)",
      },
      dateBlockHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
      },
      dateBlockTitle: {
        color: "#f4fff9",
        fontSize: 14,
        fontWeight: 950,
        letterSpacing: ".10em",
        textTransform: "uppercase",
      },
      dateBlockHint: {
        color: "rgba(231,255,247,.58)",
        fontSize: 12,
        fontWeight: 750,
      },
      datesWrap: {
        display: "grid",
        gap: 10,
      },
      date: {
        width: "100%",
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        alignItems: "center",
        gap: 14,
        padding: "15px 16px",
        borderRadius: 21,
        border: "1px solid rgba(125,255,209,.13)",
        background: "rgba(255,255,255,.045)",
        color: "#f4fff9",
        cursor: "pointer",
        textAlign: "left",
      },
      dateMain: {
        minWidth: 0,
      },
      dateLabel: {
        display: "block",
        fontWeight: 950,
        fontSize: 15,
      },
      dateMonth: {
        display: "block",
        marginTop: 4,
        color: "rgba(231,255,247,.55)",
        fontSize: 12,
        fontWeight: 750,
      },
      dateSpotsWrap: {
        display: "grid",
        justifyItems: "end",
        gap: 5,
      },
      dateSpots: {
        color: "#8fffe0",
        fontWeight: 950,
        fontSize: 13,
        whiteSpace: "nowrap",
      },
      progressTrack: {
        width: 92,
        height: 5,
        borderRadius: 999,
        background: "rgba(255,255,255,.10)",
        overflow: "hidden",
      },
      progressFill: (percentage) => ({
        height: "100%",
        width: `${percentage}%`,
        borderRadius: 999,
        background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
      }),
      bookPill: {
        border: "none",
        borderRadius: 999,
        padding: "10px 13px",
        background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
        color: "#03150f",
        fontWeight: 950,
        cursor: "pointer",
        whiteSpace: "nowrap",
      },
      fullPill: {
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 999,
        padding: "10px 13px",
        background: "rgba(255,255,255,.05)",
        color: "rgba(231,255,247,.48)",
        fontWeight: 950,
        whiteSpace: "nowrap",
      },
      noDates: {
        padding: 16,
        borderRadius: 21,
        background: "rgba(255,255,255,.035)",
        border: "1px solid rgba(125,255,209,.10)",
        color: "rgba(231,255,247,.60)",
        fontSize: 13,
      },
      emptyCard: {
        padding: 24,
        borderRadius: 32,
        background:
          "linear-gradient(145deg, rgba(8,24,18,.74), rgba(3,9,7,.94))",
        border: "1px solid rgba(125,255,209,.14)",
        color: "rgba(231,255,247,.66)",
        lineHeight: 1.6,
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
        position: "relative",
        width: "100%",
        maxWidth: 540,
        maxHeight: "90vh",
        overflowY: "auto",
        padding: 22,
        borderRadius: 34,
        background:
          "linear-gradient(145deg, rgba(8,24,18,.98), rgba(3,9,7,.99))",
        border: "1px solid rgba(125,255,209,.24)",
        boxShadow: "0 34px 100px rgba(0,0,0,.62)",
      },
      modalClose: {
        position: "absolute",
        right: 16,
        top: 16,
        width: 38,
        height: 38,
        borderRadius: 999,
        border: "1px solid rgba(125,255,209,.18)",
        background: "rgba(255,255,255,.05)",
        color: "#fff",
        fontSize: 23,
        cursor: "pointer",
      },
      modalTitle: {
        margin: "17px 0 8px",
        fontSize: 38,
        lineHeight: 0.92,
        fontWeight: 950,
        letterSpacing: "-.065em",
      },
      modalText: {
        color: "rgba(231,255,247,.72)",
        marginBottom: 16,
        lineHeight: 1.5,
      },
      selectedDateCard: {
        padding: 14,
        borderRadius: 22,
        background: "rgba(255,255,255,.045)",
        border: "1px solid rgba(125,255,209,.13)",
        marginBottom: 14,
      },
      depositModalBox: {
        padding: 14,
        borderRadius: 22,
        background: "rgba(244,208,111,.10)",
        border: "1px solid rgba(244,208,111,.24)",
        color: "#f7e2a2",
        fontSize: 13,
        lineHeight: 1.55,
        marginBottom: 14,
        fontWeight: 750,
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
        marginBottom: 10,
      },
      personRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        padding: 14,
        borderRadius: 22,
        background: "rgba(255,255,255,.045)",
        border: "1px solid rgba(125,255,209,.13)",
        marginBottom: 14,
      },
      personBtn: {
        width: 44,
        height: 44,
        borderRadius: 999,
        border: "none",
        background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
        color: "#03150f",
        fontSize: 23,
        fontWeight: 950,
        cursor: "pointer",
      },
      personNumber: {
        fontSize: 24,
        fontWeight: 950,
      },
      modalTextarea: {
        width: "100%",
        boxSizing: "border-box",
        minHeight: 104,
        borderRadius: 22,
        border: "1px solid rgba(125,255,209,.14)",
        background: "rgba(255,255,255,.045)",
        color: "#fff",
        padding: 14,
        resize: "vertical",
        marginBottom: 14,
        outline: "none",
        fontFamily: "inherit",
      },
      modalMessage: (success) => ({
        padding: 12,
        borderRadius: 18,
        background: success ? "rgba(22,245,162,.10)" : "rgba(255,80,80,.11)",
        border: success
          ? "1px solid rgba(125,255,209,.18)"
          : "1px solid rgba(255,80,80,.22)",
        color: success ? "#8fffe0" : "#ffd1d1",
        marginBottom: 14,
        fontSize: 13,
        fontWeight: 850,
        lineHeight: 1.45,
      }),
      reserve: {
        width: "100%",
        border: "none",
        padding: "16px",
        borderRadius: 999,
        background: "linear-gradient(135deg,#16f5a2,#40e7ff)",
        color: "#03150f",
        fontWeight: 950,
        cursor: "pointer",
        boxShadow: "0 22px 52px rgba(22,245,162,.20)",
      },

      packageGallery: {
        marginTop: 16,
        display: "flex",
        gap: 10,
        overflowX: "auto",
        paddingBottom: 6,
        scrollbarWidth: "none",
      },

      packageGalleryThumb: {
        position: "relative",
        minWidth: 118,
        width: 118,
        height: 88,
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid rgba(125,255,209,.14)",
        background: "rgba(255,255,255,.04)",
        cursor: "pointer",
      },

      packageGalleryImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      },

      galleryCountBadge: {
        position: "absolute",
        right: 8,
        bottom: 8,
        padding: "5px 8px",
        borderRadius: 999,
        background: "rgba(0,0,0,.58)",
        color: "#fff",
        fontSize: 11,
        fontWeight: 900,
      },

      galleryModalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.88)",
        backdropFilter: "blur(18px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      },

      galleryModal: {
        width: "100%",
        maxWidth: 1100,
        maxHeight: "92vh",
        overflowY: "auto",
        borderRadius: 34,
        padding: 16,
        background: "linear-gradient(145deg, rgba(8,24,18,.96), rgba(3,9,7,.99))",
        border: "1px solid rgba(125,255,209,.22)",
        boxShadow: "0 34px 100px rgba(0,0,0,.70)",
      },

      galleryModalTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
      },

      galleryModalTitle: {
        fontSize: 24,
        fontWeight: 950,
        letterSpacing: "-.04em",
      },

      galleryClose: {
        width: 40,
        height: 40,
        borderRadius: 999,
        border: "1px solid rgba(125,255,209,.18)",
        background: "rgba(255,255,255,.06)",
        color: "#fff",
        fontSize: 24,
        cursor: "pointer",
      },

      galleryModalGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
      },

      galleryModalImage: {
        width: "100%",
        height: 260,
        objectFit: "cover",
        borderRadius: 24,
        border: "1px solid rgba(125,255,209,.12)",
      },

      mobileCSS: `
        @media (max-width: 900px) {
          .mo-host-hero-layout {
            grid-template-columns: 1fr !important;
          }

          .mo-host-about-grid {
            grid-template-columns: 1fr !important;
          }

          .mo-host-package-top {
            grid-template-columns: 1fr !important;
          }

          .mo-host-booking-panel {
            display: none !important;
          }

          .mo-host-date-row {
            grid-template-columns: 1fr !important;
          }

          .mo-host-date-spots {
            justify-items: start !important;
          }
        }
      `,
    }),
    []
  );


  function getPackageImages(pkg) {
    const list = [];

    if (pkg?.cover_url) list.push(pkg.cover_url);

    if (Array.isArray(pkg?.gallery_urls)) {
      pkg.gallery_urls.forEach((url) => {
        if (url && !list.includes(url)) list.push(url);
      });
    }

    if (!list.length && host?.cover_url) list.push(host.cover_url);
    if (!list.length) list.push(FALLBACK);

    return list;
  }

  if (loading) return <div style={styles.loadingPage}>Loading experience...</div>;
  if (!host) return <div style={styles.loadingPage}>Host not found</div>;

  if (hostInactive) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingPage}>
          <div style={styles.unavailableCard}>
            <div style={styles.badge}>Host unavailable</div>
            <h1 style={{ ...styles.title, fontSize: "clamp(42px,7vw,82px)", marginTop: 18 }}>
              This experience is not available.
            </h1>
            <div style={styles.heroDescription}>
              This host profile is currently inactive or awaiting approval.
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <img src={host.cover_url || FALLBACK} style={styles.heroImage} alt={host.name} />
        <div style={styles.heroOverlay} />
        <div style={styles.heroGrid} />

        <div style={styles.heroInner}>
          <div className="mo-host-hero-layout" style={styles.heroLayout}>
            <div>
              <div style={styles.badgeRow}>
                <span style={styles.badge}>Experience Host</span>
                {host.verified ? <span style={styles.glassBadge}>Verified</span> : null}
                {packageStats.freeSpots > 0 ? (
                  <span style={styles.glassBadge}>{packageStats.freeSpots} spots available</span>
                ) : null}
              </div>

              <h1 style={styles.title}>{host.name}</h1>

              <div style={styles.subtitle}>
                <span>📍 {host.location || "Outdoor experience"}</span>
                <span style={styles.dot} />
                <span>⭐ {host.rating || "New"}</span>
                <span style={styles.dot} />
                <span>{host.reviews_count || 0} reviews</span>
              </div>

              <div style={styles.heroDescription}>
                {host.short_description ||
                  host.description ||
                  "Book real outdoor experiences with available dates, real spots and verified hosts."}
              </div>

              <div style={styles.heroActions}>
                <button
                  type="button"
                  style={styles.primaryButton}
                  onClick={() => {
                    if (firstAvailablePackage && firstAvailableDate) {
                      openReservation(firstAvailablePackage, firstAvailableDate);
                    }
                  }}
                >
                  Reserve experience
                </button>

                <button
                  type="button"
                  style={styles.ghostButton}
                  onClick={() => {
                    const element = document.getElementById("packages");
                    element?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  View packages
                </button>

                {host.map_url ? (
                  <button
                    type="button"
                    style={styles.ghostButton}
                    onClick={() => window.open(host.map_url, "_blank")}
                  >
                    Open map
                  </button>
                ) : null}
              </div>
            </div>

            <aside className="mo-host-booking-panel" style={styles.bookingPanel}>
              <div style={styles.panelTop}>
                <div>
                  <div style={styles.panelEyebrow}>Quick booking</div>
                  <div style={styles.panelTitle}>
                    {firstAvailablePackage?.title || "Choose an experience"}
                  </div>
                </div>

                <div style={styles.panelPrice}>
                  {firstAvailablePackage?.price
                    ? `${firstAvailablePackage.price} ${firstAvailablePackage.currency || "EUR"}`
                    : "From host"}
                </div>
              </div>

              <div style={styles.panelStats}>
                <div style={styles.panelStat}>
                  <span style={styles.panelStatNumber}>{packages.length}</span>
                  <span style={styles.panelStatLabel}>Packages</span>
                </div>

                <div style={styles.panelStat}>
                  <span style={styles.panelStatNumber}>{packageStats.totalDates}</span>
                  <span style={styles.panelStatLabel}>Dates</span>
                </div>

                <div style={styles.panelStat}>
                  <span style={styles.panelStatNumber}>{packageStats.freeSpots}</span>
                  <span style={styles.panelStatLabel}>Spots</span>
                </div>
              </div>

              <button
                type="button"
                style={{ ...styles.primaryButton, width: "100%", marginTop: 16 }}
                onClick={() => {
                  if (firstAvailablePackage && firstAvailableDate) {
                    openReservation(firstAvailablePackage, firstAvailableDate);
                  }
                }}
              >
                Book next available
              </button>
            </aside>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div className="mo-host-about-grid" style={styles.aboutGrid}>
          <div>
            <div style={styles.sectionEyebrow}>About the host</div>
            <h2 style={styles.sectionTitle}>Real outdoor experiences, ready to book.</h2>
            <div style={{ ...styles.about, marginTop: 18 }}>
              {host.description ||
                host.short_description ||
                "This host has not added a description yet."}
            </div>
          </div>

          <div style={styles.trustCard}>
            <div style={styles.sectionEyebrow}>Host snapshot</div>

            <div style={styles.trustRow}>
              <span>Category</span>
              <span style={styles.trustValue}>{host.category || "Outdoor"}</span>
            </div>

            <div style={styles.trustRow}>
              <span>Location</span>
              <span style={styles.trustValue}>{host.location || "Not set"}</span>
            </div>

            <div style={styles.trustRow}>
              <span>Address</span>
              <span style={styles.trustValue}>{host.address || "Not set"}</span>
            </div>

            <div style={styles.trustRow}>
              <span>Verified</span>
              <span style={styles.trustValue}>{host.verified ? "Yes" : "Pending"}</span>
            </div>
          </div>
        </div>

        <div style={styles.contactGrid}>
          {host.phone ? (
            <div style={styles.contactCard}>
              <div style={styles.contactLabel}>Phone</div>
              <div style={styles.contactValue}>{host.phone}</div>
            </div>
          ) : null}

          {host.email ? (
            <div style={styles.contactCard}>
              <div style={styles.contactLabel}>Email</div>
              <div style={styles.contactValue}>{host.email}</div>
            </div>
          ) : null}

          {host.instagram ? (
            <div style={styles.contactCard}>
              <div style={styles.contactLabel}>Instagram</div>
              <div style={styles.contactValue}>{host.instagram}</div>
            </div>
          ) : null}

          {host.whatsapp ? (
            <div style={styles.contactCard}>
              <div style={styles.contactLabel}>WhatsApp</div>
              <div style={styles.contactValue}>{host.whatsapp}</div>
            </div>
          ) : null}

          {host.website ? (
            <div style={styles.contactCard}>
              <div style={styles.contactLabel}>Website</div>
              <div style={styles.contactValue}>{host.website}</div>
            </div>
          ) : null}

          {host.map_url ? (
            <div style={styles.contactCard}>
              <div style={styles.contactLabel}>Map</div>
              <button
                type="button"
                style={{ ...styles.primaryButton, padding: "11px 14px" }}
                onClick={() => window.open(host.map_url, "_blank")}
              >
                Open location
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section id="packages" style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionEyebrow}>Book experiences</div>
            <h2 style={styles.sectionTitle}>Packages & available dates</h2>
            <div style={styles.sectionSubtitle}>
              Choose a package, pick an available date and send a reservation request.
            </div>
          </div>
        </div>

        <div style={styles.packageGrid}>
          {packages.length ? (
            packages.map((pkg) => {
              const packageDates = dates.filter((x) => x.package_id === pkg.id);

              return (
                <article key={pkg.id} style={styles.packageCard}>
                  <div className="mo-host-package-top" style={styles.packageTop}>
                    <div style={styles.coverWrap}>
                      <img
                        src={pkg.cover_url || host.cover_url || FALLBACK}
                        alt={pkg.title}
                        style={styles.cover}
                      />
                      <div style={styles.coverOverlay} />
                      <div style={styles.coverBadge}>{pkg.duration || "Experience"}</div>

                      <div style={styles.coverBottom}>
                        <div style={styles.glassBadge}>
                          {packageDates.length} date{packageDates.length === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>

                    <div style={styles.packageBody}>
                      <div>
                        <h3 style={styles.packageTitle}>{pkg.title}</h3>

                        <div style={styles.price}>
                          {pkg.price
                            ? `${pkg.price} ${pkg.currency || "EUR"}`
                            : "Price on request"}
                          {pkg.duration ? ` • ${pkg.duration}` : ""}
                        </div>

                        {pkg.deposit_required ? (
                          <div style={styles.depositBox}>
                            Deposit required: {pkg.deposit_amount || 0} {pkg.currency || "EUR"}
                            <br />
                            Your spot is confirmed only after the host verifies the deposit.
                          </div>
                        ) : null}

                        {pkg.description ? (
                          <div style={styles.packageDescription}>{pkg.description}</div>
                        ) : null}

                        {pkg.included?.length ? (
                          <div style={styles.included}>
                            {pkg.included.map((item) => (
                              <span key={item} style={styles.chip}>
                                ✓ {item}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {getPackageImages(pkg).length ? (
                          <div style={styles.packageGallery}>
                            {getPackageImages(pkg).slice(0, 8).map((img, index) => (
                              <button
                                key={`${pkg.id}-gallery-${index}`}
                                type="button"
                                style={styles.packageGalleryThumb}
                                onClick={() =>
                                  setGalleryOpen({
                                    title: pkg.title,
                                    images: getPackageImages(pkg),
                                  })
                                }
                              >
                                <img src={img} alt="" style={styles.packageGalleryImage} />
                                {index === 0 ? (
                                  <span style={styles.galleryCountBadge}>
                                    {getPackageImages(pkg).length} photos
                                  </span>
                                ) : null}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div style={styles.dateBlock}>
                        <div style={styles.dateBlockHeader}>
                          <div style={styles.dateBlockTitle}>Available dates</div>
                          <div style={styles.dateBlockHint}>Tap a date to book</div>
                        </div>

                        <div style={styles.datesWrap}>
                          {packageDates.length ? (
                            packageDates.map((d) => {
                              const unavailable = d.free_spots <= 0 || d.closed;
                              const taken = Math.max(0, (d.total_spots || 0) - (d.free_spots || 0));
                              const percentage = d.total_spots
                                ? Math.min(100, Math.round((taken / d.total_spots) * 100))
                                : 0;

                              return (
                                <button
                                  key={d.id}
                                  type="button"
                                  className="mo-host-date-row"
                                  style={{
                                    ...styles.date,
                                    opacity: unavailable ? 0.55 : 1,
                                    cursor: unavailable ? "not-allowed" : "pointer",
                                  }}
                                  disabled={unavailable}
                                  onClick={() => openReservation(pkg, d)}
                                >
                                  <span style={styles.dateMain}>
                                    <span style={styles.dateLabel}>
                                      {formatDateRange(d.start_date, d.end_date)}
                                    </span>
                                    <span style={styles.dateMonth}>{getMonthLabel(d.start_date)}</span>
                                  </span>

                                  <span className="mo-host-date-spots" style={styles.dateSpotsWrap}>
                                    <span style={styles.dateSpots}>
                                      {unavailable ? "FULL" : `${d.free_spots}/${d.total_spots} free`}
                                    </span>

                                    <span style={styles.progressTrack}>
                                      <span style={styles.progressFill(percentage)} />
                                    </span>
                                  </span>

                                  <span style={unavailable ? styles.fullPill : styles.bookPill}>
                                    {unavailable ? "Full" : "Book"}
                                  </span>
                                </button>
                              );
                            })
                          ) : (
                            <div style={styles.noDates}>No available dates yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div style={styles.emptyCard}>No packages yet.</div>
          )}
        </div>
      </section>


      {galleryOpen ? (
        <div style={styles.galleryModalOverlay}>
          <div style={styles.galleryModal}>
            <div style={styles.galleryModalTop}>
              <div>
                <div style={styles.badge}>Gallery</div>
                <div style={styles.galleryModalTitle}>{galleryOpen.title}</div>
              </div>

              <button
                type="button"
                style={styles.galleryClose}
                onClick={() => setGalleryOpen(null)}
              >
                ×
              </button>
            </div>

            <div style={styles.galleryModalGrid}>
              {galleryOpen.images.map((img, index) => (
                <img
                  key={`${img}-${index}`}
                  src={img}
                  alt=""
                  style={styles.galleryModalImage}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {selectedDate ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <button
              type="button"
              style={styles.modalClose}
              onClick={() => {
                setSelectedDate(null);
                setSelectedPackage(null);
                setBookingMessage("");
                setBookingSuccess(false);
              }}
            >
              ×
            </button>

            <div style={styles.badge}>Reserve experience</div>

            <h2 style={styles.modalTitle}>{selectedPackage?.title}</h2>

            <div style={styles.selectedDateCard}>
              <div style={styles.dateLabel}>
                {formatDateRange(selectedDate.start_date, selectedDate.end_date)}
              </div>
              <div style={styles.dateMonth}>
                {selectedDate.free_spots}/{selectedDate.total_spots} spots available
              </div>
            </div>

            {selectedPackage?.deposit_required ? (
              <div style={styles.depositModalBox}>
                <strong>
                  Deposit required: {selectedPackage.deposit_amount || 0}{" "}
                  {selectedPackage.currency || "EUR"}
                </strong>
                <br />
                Your reservation is not confirmed until the host verifies the deposit.
                <br />
                <br />
                <strong>Deposit instructions:</strong>
                <br />
                {selectedPackage.deposit_instructions ||
                  host.payment_instructions ||
                  "The host will contact you with payment details."}
              </div>
            ) : (
              <div style={styles.selectedDateCard}>
                No deposit required for this package. The host can still confirm or reject your request.
              </div>
            )}

            <p style={styles.modalText}>
              Add your contact details. The host will see your request inside their dashboard.
            </p>

            <input
              style={styles.input}
              placeholder="Full name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Email *"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Phone *"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />

            <div style={styles.personRow}>
              <button
                type="button"
                style={styles.personBtn}
                onClick={() => setPersons((x) => Math.max(1, x - 1))}
              >
                -
              </button>

              <strong style={styles.personNumber}>{persons}</strong>

              <button
                type="button"
                style={styles.personBtn}
                onClick={() => setPersons((x) => Math.min(selectedDate.free_spots, x + 1))}
              >
                +
              </button>
            </div>

            <textarea
              style={styles.modalTextarea}
              placeholder="Note for host"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {bookingMessage ? (
              <div style={styles.modalMessage(bookingSuccess)}>{bookingMessage}</div>
            ) : null}

            <button
              type="button"
              style={styles.reserve}
              onClick={reserveDate}
              disabled={bookingLoading}
            >
              {bookingLoading ? "Sending..." : "Send reservation request"}
            </button>
          </div>
        </div>
      ) : null}

      <style>{styles.mobileCSS}</style>
    </main>
  );
}
